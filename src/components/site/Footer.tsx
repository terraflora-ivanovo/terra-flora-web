import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Header";
import { useTenant } from "@/lib/tenant-context";

export const VK_URL = "https://vk.ru/anastasia_voronina91";
export const TELEGRAM_URL = "https://t.me/anastasiya_voronina_37";

type IconProps = {
  className?: string;
};

export const VkIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M15.684 0H8.316C1.593 0 0 1.592 0 8.316v7.368C0 22.407 1.593 24 8.316 24h7.368C22.407 24 24 22.408 24 15.684V8.316C24 1.592 22.407 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.723-1.033-1-1.489-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.709 0-.203.17-.407.407-.407h2.744c.356 0 .491.194.491.61v3.305c0 .355.153.49.254.49.22 0 .407-.135.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.644-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.252.745.847 1.32 1.558 1.472 2.049.17.49-.085.745-.576.745z" />
  </svg>
);

export const TelegramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

type SocialLinksProps = {
  className?: string;
  linkClassName?: string;
};

export function SocialLinks({ className, linkClassName }: SocialLinksProps) {
  const link =
    linkClassName ??
    "grid h-11 w-11 place-items-center rounded-full bg-white text-primary transition-all duration-300 hover:-translate-y-0.5";

  return (
    <div className={className}>
      <a
        href={VK_URL}
        aria-label="ВКонтакте"
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        <VkIcon className="h-5 w-5" />
      </a>
      <a
        href={TELEGRAM_URL}
        aria-label="Telegram"
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        <TelegramIcon className="h-5 w-5" />
      </a>
    </div>
  );
}

type BlockProps = {
  className?: string;
};

export function Footer() {
  const { slug, tenant } = useTenant();
  const phoneHref = `tel:${tenant.phone.replace(/\s+/g, "")}`;

  const ContactBlock = ({ className }: BlockProps) => (
    <div className={className}>
      <a href={phoneHref} className="transition-opacity hover:opacity-100">
        {tenant.phone}
      </a>
      <span>{tenant.address}</span>
    </div>
  );

  const LegalLinks = ({ className }: BlockProps) => (
    <div className={className}>
      <Link to="/s/$slug/privacy" params={{ slug }} className="transition-opacity hover:opacity-100">
        Политика конфиденциальности
      </Link>
      <Link to="/s/$slug/offer" params={{ slug }} className="transition-opacity hover:opacity-100">
        Публичная оферта
      </Link>
    </div>
  );

  return (
    <footer className="mt-20 bg-primary pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 pt-14 text-left md:hidden lg:px-10">
        <Logo
          name={tenant.name}
          className="font-logo whitespace-nowrap text-3xl tracking-wide text-primary-foreground"
          accentClassName="opacity-90"
        />
        <SocialLinks className="flex items-center gap-3" />
        <ContactBlock className="flex flex-col items-start gap-1 text-sm opacity-90" />
        <LegalLinks className="flex flex-col items-start gap-1 text-xs opacity-70" />
      </div>

      <div className="mx-auto hidden max-w-7xl gap-10 px-6 pt-14 md:grid md:grid-cols-3 md:items-center lg:px-10">
        <div className="flex flex-col items-start gap-6">
          <Logo
            name={tenant.name}
            className="font-logo whitespace-nowrap text-3xl tracking-wide text-primary-foreground"
            accentClassName="opacity-90"
          />
          <LegalLinks className="flex flex-col gap-1 text-xs opacity-70" />
        </div>
        <ContactBlock className="flex flex-col items-center gap-1 text-center text-sm opacity-90" />
        <SocialLinks className="flex items-center justify-end gap-3" />
      </div>
    </footer>
  );
}
