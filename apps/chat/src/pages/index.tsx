import Head from "next/head";
import "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <Head>
        <title>Lanchonete — Demo</title>
        <Button>Oi carai</Button>
      </Head>
      <main className="min-h-screen p-4">
        <h1 className="text-2xl font-bold">Boilerplate Monorepo</h1>
        <p className="mt-4">Next.js + Tailwind + shadcn/ui + lucide</p>
      </main>
    </>
  );
}
