# svelte-template

Customized Svelte Template

### Features

-   SCSS Support
-   TypeScript Support
-   Prettier
-   Source Maps for only development mode
-   `rollup-plugin-serve` in `rollup.config.js`

---

![SS](https://i.imgur.com/f8NcA12.png)

---

### How To Use

-   Run `npx degit berkinakkaya/svelte-template PROJECT_NAME`
-   Run `cd PROJECT_NAME` and `npm install`
-   **NOTE:** If you open the project before running `npm install`, TypeScript will complain about `tsconfig.json`. If that's the case, run `npm install` and restart the editor.

### VS Code Notes

-   Install [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension or remove the `.prettierrc` file
-   Use the new [Svelte Extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).
-   Set `Svelte > Language Server: Runtime` path for SCSS support ([Tutorial](https://daveceddia.com/svelte-with-sass-in-vscode/))
-   If you use Prettier, set Default Formatter on VS Code as `esbenp.prettier-vscode` and enable `Format On Save`
