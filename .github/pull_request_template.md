## Summary

> Briefly describe the purpose of this PR

---

## Checklist

1. [ ] This PR focuses on a single change, feature, or theme
1. [ ] Code is clear, commented, and documented (where needed)
1. [ ] Version bumped appropriately (see below)
1. [ ] `npm run build` was run (if applicable - see below)

---

## Version Bump & Build (Important)

If your change affects users, you must bump the version in `package.json` - here:
- https://github.com/mwood77/ws4kp-international/blob/e26f66ae6dd28ac73f62ff0e1d4ca75d6b3f9bcd/package.json#L3

Versioning uses [Semantic Versioning](https://semver.org):

- `PATCH` – small fix or tweak (`1.2.3` → `1.2.4`)
- `MINOR` – adds backward-compatible features (`1.2.3` → `1.3.0`)
- `MAJOR` – breaking changes (`1.2.3` → `2.0.0`)

After you've updated the version, you now need to build the project and attach the output. Simply run this in your terminal:

```bash
npm run build
```

And then commit the changed files (the build).

Deployment is handled automatically when the code is merged into the `main` branch.

---