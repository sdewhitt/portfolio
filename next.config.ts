import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  // remark/rehype plugins can go here later
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default withMDX(nextConfig);
