import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/lib/database.types";
import { formatPriceRub, publicImageUrl, uploadProductImage } from "@/lib/product-image";
import { slugify } from "@/lib/slug";
import { trySupabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { requireOwner } from "./s.$slug.owner";

export const Route = createFileRoute("/s/$slug/owner/products")({
  beforeLoad: async ({ params }) => {
    const { loadTenantBySlug } = await import("@/lib/tenant-api");
    const bundle = await loadTenantBySlug(params.slug);
    await requireOwner(params.slug, bundle?.tenant.owner_user_id ?? null);
  },
  component: OwnerProducts,
});

type EditorMode = "create" | "edit";

type FormState = {
  name: string;
  priceRub: string;
  description: string;
  categoryId: string;
  newCategoryName: string;
  imagePath: string | null;
};

const emptyForm = (): FormState => ({
  name: "",
  priceRub: "",
  description: "",
  categoryId: "",
  newCategoryName: "",
  imagePath: null,
});

function formFromProduct(p: Product): FormState {
  return {
    name: p.name,
    priceRub: String(p.price_rub),
    description: p.description ?? "",
    categoryId: p.category_id ?? "",
    newCategoryName: "",
    imagePath: p.image_path,
  };
}

function OwnerProducts() {
  const { tenant } = useTenant();
  const sb = trySupabase();
  const qc = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["owner-products", tenant.id],
    queryFn: async () => {
      if (!sb) return [];
      const { data, error } = await sb
        .from("products")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["owner-categories", tenant.id],
    queryFn: async () => {
      if (!sb) return [] as Category[];
      const { data, error } = await sb
        .from("categories")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = categoriesQuery.data ?? [];
  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const openCreate = () => {
    setEditorMode("create");
    setEditing(null);
    setForm(emptyForm());
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditorMode("edit");
    setEditing(p);
    setForm(formFromProduct(p));
    setImageFile(null);
    setImagePreview(publicImageUrl(p.image_path));
    setFormError(null);
    setEditorOpen(true);
  };

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resolveCategoryId = async (): Promise<string | null> => {
    if (!sb) throw new Error("Supabase не настроен");
    const typed = form.newCategoryName.trim();
    if (typed) {
      const slug = slugify(typed);
      const existing = categories.find((c) => c.slug === slug || c.name.toLowerCase() === typed.toLowerCase());
      if (existing) return existing.id;

      const maxSort = categories.reduce((m, c) => Math.max(m, c.sort_order), -1);
      const { data, error } = await sb
        .from("categories")
        .insert({
          tenant_id: tenant.id,
          name: typed,
          slug,
          sort_order: maxSort + 1,
        })
        .select("*")
        .single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["owner-categories", tenant.id] });
      return data.id;
    }
    return form.categoryId || null;
  };

  const uniqueProductSlug = async (base: string, excludeId?: string) => {
    if (!sb) return base;
    let candidate = base;
    let n = 2;
    for (;;) {
      const { data, error } = await sb
        .from("products")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("slug", candidate)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.id === excludeId) return candidate;
      candidate = `${base}-${n}`;
      n += 1;
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sb) throw new Error("Supabase не настроен");
      const name = form.name.trim();
      if (!name) throw new Error("Укажите название");
      const priceRub = Number(form.priceRub);
      if (!Number.isFinite(priceRub) || priceRub < 0 || !Number.isInteger(priceRub)) {
        throw new Error("Цена должна быть целым числом ≥ 0");
      }

      const categoryId = await resolveCategoryId();
      let imagePath = form.imagePath;
      if (imageFile) {
        imagePath = await uploadProductImage(sb, tenant.slug, imageFile);
      }

      if (editorMode === "create") {
        const slug = await uniqueProductSlug(slugify(name));
        const maxSort = (productsQuery.data ?? []).reduce((m, p) => Math.max(m, p.sort_order), -1);
        const { error } = await sb.from("products").insert({
          tenant_id: tenant.id,
          category_id: categoryId,
          name,
          slug,
          description: form.description.trim(),
          price_rub: priceRub,
          image_path: imagePath,
          is_custom: false,
          in_stock: true,
          is_published: true,
          is_popular: false,
          sort_order: maxSort + 1,
        });
        if (error) throw error;
        return;
      }

      if (!editing) throw new Error("Товар не выбран");
      const { error } = await sb
        .from("products")
        .update({
          name,
          description: form.description.trim(),
          price_rub: priceRub,
          category_id: categoryId,
          image_path: imagePath,
        })
        .eq("id", editing.id)
        .eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["owner-products", tenant.id] }),
        qc.invalidateQueries({ queryKey: ["owner-categories", tenant.id] }),
      ]);
      setEditorOpen(false);
    },
    onError: (err: Error) => setFormError(err.message || "Не удалось сохранить"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!sb) throw new Error("Supabase не настроен");
      const { error } = await sb.from("products").delete().eq("id", id).eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["owner-products", tenant.id] });
      setEditorOpen(false);
    },
    onError: (err: Error) => setFormError(err.message || "Не удалось удалить"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      field: "is_published" | "is_popular";
      value: boolean;
    }) => {
      if (!sb) throw new Error("Supabase не настроен");
      const { error } = await sb
        .from("products")
        .update({ [payload.field]: payload.value })
        .eq("id", payload.id)
        .eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["owner-products", tenant.id] });
      const prev = qc.getQueryData<Product[]>(["owner-products", tenant.id]);
      qc.setQueryData<Product[]>(["owner-products", tenant.id], (list) =>
        (list ?? []).map((p) => (p.id === payload.id ? { ...p, [payload.field]: payload.value } : p)),
      );
      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(["owner-products", tenant.id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["owner-products", tenant.id] }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    saveMutation.mutate();
  };

  const onDelete = () => {
    if (!editing) return;
    if (!window.confirm(`Удалить «${editing.name}»?`)) return;
    setFormError(null);
    deleteMutation.mutate(editing.id);
  };

  if (!sb) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-light text-primary">Товары</h1>
        <p className="text-muted-foreground">
          Подключите Supabase, чтобы редактировать каталог. Витрина показывает только товары из базы.
        </p>
      </div>
    );
  }

  const previewSrc = imagePreview ?? publicImageUrl(form.imagePath);
  const busy = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-primary">Товары</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Клик по карточке — редактирование. Тумблеры сразу пишут в базу.
          </p>
        </div>
        <Button type="button" size="lg" className="rounded-full px-6" onClick={openCreate}>
          <Plus className="size-4" />
          Добавить букет
        </Button>
      </div>

      {productsQuery.isLoading ? <p className="text-muted-foreground">Загружаем...</p> : null}

      <ul className="space-y-3">
        {(productsQuery.data ?? []).map((p) => {
          const thumb = publicImageUrl(p.image_path);
          return (
            <li key={p.id}>
              <button
                type="button"
                className="glass flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-primary/5"
                onClick={() => openEdit(p)}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                    {thumb ? (
                      <img src={thumb} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        нет фото
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xl font-light">
                      {p.name}
                      {p.is_custom ? (
                        <span className="ml-2 text-xs uppercase tracking-wide text-accent">инд.</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-accent">{formatPriceRub(p.price_rub)}</p>
                    {p.category_id && categoryNameById[p.category_id] ? (
                      <p className="text-xs text-muted-foreground">{categoryNameById[p.category_id]}</p>
                    ) : null}
                  </div>
                </div>
                <div
                  className="flex flex-wrap gap-4 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.is_popular}
                      disabled={toggleMutation.isPending || p.is_custom}
                      onChange={(e) =>
                        toggleMutation.mutate({
                          id: p.id,
                          field: "is_popular",
                          value: e.target.checked,
                        })
                      }
                    />
                    Популярный букет
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.is_published}
                      disabled={toggleMutation.isPending}
                      onChange={(e) =>
                        toggleMutation.mutate({
                          id: p.id,
                          field: "is_published",
                          value: e.target.checked,
                        })
                      }
                    />
                    Опубликован
                  </label>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "create" ? "Новый букет" : "Редактирование букета"}
            </DialogTitle>
            <DialogDescription>
              Название, цена, описание, категория и фото. Статусы меняются тумблерами в списке.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="product-name">Название</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Цена, ₽</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step={1}
                value={form.priceRub}
                onChange={(e) => setForm((f) => ({ ...f, priceRub: e.target.value }))}
                required
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Описание</Label>
              <Textarea
                id="product-description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Категория</Label>
              <select
                id="product-category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value, newCategoryName: "" }))
                }
                disabled={busy || Boolean(form.newCategoryName.trim())}
              >
                <option value="">Без категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="или впишите новую категорию"
                value={form.newCategoryName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newCategoryName: e.target.value,
                    categoryId: e.target.value.trim() ? "" : f.categoryId,
                  }))
                }
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-image">Фотография</Label>
              <div className="overflow-hidden rounded-xl bg-sand/40">
                {previewSrc ? (
                  <img src={previewSrc} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                    Нет фото
                  </div>
                )}
              </div>
              <Input
                id="product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onPickImage}
                disabled={busy}
              />
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter className="gap-2 sm:justify-between">
              {editorMode === "edit" ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={onDelete}
                  className="sm:mr-auto"
                >
                  <Trash2 className="size-4" />
                  Удалить
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditorOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={busy}>
                  {saveMutation.isPending ? "Сохраняем..." : "Сохранить"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
