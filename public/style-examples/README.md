# Style example images (manual)

**Goal:** Show users what each art style looks like before they choose. Each style card in the UI displays an example portrait (dog or cat) so customers can see the outcome.

**You add the photos later:**

1. Run the predefined prompts (from `lib/prompts/artStyles.ts`) on different dogs and cats using your image generator.
2. Save the resulting images here with these exact filenames so the UI can display them:

| Style ID       | Filename           |
|----------------|--------------------|
| renaissance    | `renaissance.jpg`  |
| baroque        | `baroque.jpg`      |
| victorian      | `victorian.jpg`    |
| regal          | `regal.jpg`        |
| belle_epoque    | `belle_epoque.jpg` |

You can use `.png` instead of `.jpg` if you prefer; if you do, add the same names with `.png` and update the API or frontend to use the extension you chose.

Until the files exist, the style selector will show a placeholder or broken image; once you add them, the examples appear automatically.
