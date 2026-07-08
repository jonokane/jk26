import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";

// Velite compiles each MDX body to a string of JS that, when executed with a
// jsx-runtime, returns the MDX component. This runs on the server by default.
function useMDXComponent(code: string): ComponentType<{
  components?: Record<string, ComponentType>;
}> {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
}

/** Custom components available to every MDX file (extend as the site grows). */
const mdxComponents: Record<string, ComponentType> = {};

export function MDXContent({
  code,
  components,
}: {
  code: string;
  components?: Record<string, ComponentType>;
}) {
  const Component = useMDXComponent(code);
  return <Component components={{ ...mdxComponents, ...components }} />;
}
