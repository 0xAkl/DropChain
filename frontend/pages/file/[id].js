import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * /file/[id] → redirects to /retrieve?cid=[id]
 * Keeps backward-compat with any shared links using the old route.
 */
export default function FileRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (router.query.id) {
      router.replace(`/retrieve?cid=${router.query.id}`);
    }
  }, [router.query.id]);
  return null;
}
