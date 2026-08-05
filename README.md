# MAO Translations

The release index for [mao-tls.github.io](https://mao-tls.github.io/).

The homepage is deliberately separate from each project site:

- the root lists finished public releases;
- each release owns its downloads, requirements, installation notes, and
  supporting material;
- project-specific visual identities remain on their project pages.

## Local preview

Serve the `public` directory with any static file server, then open the local
URL in a browser.

## Validation

```sh
npm test
```

GitHub Actions tests the static files and deploys `public` to GitHub Pages on
pushes to `main`.
