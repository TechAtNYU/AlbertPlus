import Image from "next/image";

interface AlbertPlusLogoProps {
  width: number;
  height: number;
  variant?: "full" | "icon";
  href?: string;
  className?: string;
}

export function AlbertPlusLogo({
  width,
  height,
  variant = "full",
  href = "/",
  className = "flex items-center justify-center self-center",
}: AlbertPlusLogoProps) {
  const lightSrc = variant === "icon" ? "/logo_icon.svg" : "/logo.svg";
  const darkSrc = variant === "icon" ? "/logo_icon_dark.svg" : "/logo_dark.svg";

  return (
    <a href={href} className={className}>
      <Image
        src={lightSrc}
        alt="AlbertPlus Logo"
        width={width}
        height={height}
        className="dark:hidden"
      />
      <Image
        src={darkSrc}
        alt="AlbertPlus Logo"
        width={width}
        height={height}
        className="hidden dark:block"
      />
    </a>
  );
}
