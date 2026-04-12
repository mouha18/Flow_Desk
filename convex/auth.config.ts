export default {
  providers: [
    {
      domain: process.env["CONVEX_SITE_URL"] ?? "https://placeholder.convex.cloud",
      applicationID: "convex",
    },
  ],
};
