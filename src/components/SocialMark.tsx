import { DiscordLogo, EnvelopeSimple, Globe, InstagramLogo, TelegramLogo, TiktokLogo, XLogo, YoutubeLogo, type IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";

const MARKS: Record<string, ComponentType<IconProps>> = {
  X: XLogo,
  Twitter: XLogo,
  Telegram: TelegramLogo,
  Discord: DiscordLogo,
  Instagram: InstagramLogo,
  TikTok: TiktokLogo,
  YouTube: YoutubeLogo,
  Website: Globe,
  Email: EnvelopeSimple,
};

export function hasSocialMark(name?: string) {
  return Boolean(name && MARKS[name]);
}

export function SocialMark({ name, size = 16 }: { name?: string; size?: number }) {
  const Icon = name ? MARKS[name] : undefined;
  if (!Icon) return null;
  return <Icon className="social-mark" size={size} weight="fill" />;
}
