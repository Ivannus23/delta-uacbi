import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const src = value ? urlFor(value).width(1600).url() : null;
      if (!src) return null;

      // Si no tienes metadata de dimensiones, usamos 16:9
      return (
        <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <Image
            src={src}
            alt={value?.alt || "Imagen"}
            width={1600}
            height={900}
            className="h-auto w-full"
          />
          {value?.alt ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">{value.alt}</p>
          ) : null}
        </div>
      );
    },
  },

  block: {
    h2: ({ children }) => <h2 className="mt-8 text-xl font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-6 text-lg font-semibold">{children}</h3>,
    normal: ({ children }) => <p className="mt-4 leading-7 text-muted-foreground">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-white/15 pl-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc pl-6 text-muted-foreground">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal pl-6 text-muted-foreground">{children}</ol>
    ),
  },

  listItem: {
    bullet: ({ children }) => <li className="mt-2">{children}</li>,
    number: ({ children }) => <li className="mt-2">{children}</li>,
  },

  marks: {
    strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
    em: ({ children }) => <em className="text-foreground/90">{children}</em>,
    link: ({ value, children }) => (
      <a
        className="underline underline-offset-4 hover:text-foreground"
        href={value?.href}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ),
  },
};

export function RichText({ value }: { value: any }) {
  return <PortableText value={value} components={components} />;
}
