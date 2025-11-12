export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="flex justify-between w-full items-center p-10 px-12 gap-4 h-16">
        <div>
          <img
            src="/logo.png"
            alt="AlbertPlus"
            className="h-8 block dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="AlbertPlus"
            className="h-8 hidden dark:block"
          />
        </div>
      </header>

      {children}
    </>
  );
}
