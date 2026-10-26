import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/vivo-vr-patcher/",
  title: "vr.ko Patcher Demo",
  description: "A simple vr.ko patcher via WebAssembly",
  head: [
    ["link", { rel: "icon", href: "https://vitepress.dev/vitepress-logo-mini.svg" }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'demo', link: '/demo' }
    ],
  }
})
