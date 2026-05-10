import { useLanguage, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const FLAGS: Record<Lang, { flag: string; label: string }> = {
  vi: { flag: "🇬🇧", label: "English" },
  en: { flag: "🇬🇧", label: "English" },
  zh: { flag: "🇨🇳", label: "中文" },
};

export function LanguageSwitcher() {
  const [lang, setLang] = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-base">
          <span aria-hidden>{FLAGS[lang].flag}</span>
          <span className="text-xs uppercase tracking-wider">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.keys(FLAGS) as Lang[]).map((k) => (
          <DropdownMenuItem key={k} onClick={() => setLang(k)} className="gap-2">
            <span>{FLAGS[k].flag}</span>
            <span>{FLAGS[k].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
