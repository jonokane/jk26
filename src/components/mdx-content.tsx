import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";
import { MdxImage } from "@/components/mdx/figure";
import { Breakout } from "@/components/mdx/breakout";
import { Pin } from "@/components/mdx/pin";

// Velite compiles each MDX body to a string of JS that, when executed with a
// jsx-runtime, returns the MDX component. This runs on the server by default.
function useMDXComponent(code: string): ComponentType<{
  components?: Record<string, ComponentType>;
}> {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
}

/** Custom components available to every MDX file (extend as the site grows).
    `img` upgrades every markdown image into a captioned <figure> (figure.tsx).
    `any` here: this map holds components with incompatible prop shapes
    (MdxImage's props are all optional; Breakout requires `children`), so no
    single non-`any` prop type is contravariantly compatible with every entry. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdxComponents: Record<string, ComponentType<any>> = { img: MdxImage, Breakout, Pin };

export function MDXContent({
  code,
  components,
}: {
  code: string;
  components?: Record<string, ComponentType>;
}) {
  // Each MDX body compiles to its own component, so the identity changing
  // with `code` is the point. This is a server component (SSG) — there is no
  // client re-render churn for the rule to protect against.
  const Component = useMDXComponent(code);
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={{ ...mdxComponents, ...components }} />;
}
