/* The @modal slot renders nothing when no case study is intercepted. Next 16
   requires an explicit default for every parallel-route slot or the build
   fails; null is the "closed" state (Next docs, Parallel Routes → Modals). */
export default function Default() {
  return null;
}
