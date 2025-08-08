# n8n-nodes-cheerio-html-parser

This is a custom n8n node that uses Cheerio to parse HTML content.

## Features

- Parse HTML using multiple CSS selectors
- Convert selected output to array or string
- Remove unwanted elements (scripts, styles, navigation, etc.) before parsing
- Extract specific attributes from elements

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Build the node:
```bash
npm run build
```
4. Link to your n8n installation:
```bash
npm link
```
5. In your n8n installation directory, run:
```bash
npm link n8n-nodes-cheerio-html-parser
```

## Usage

1. Add the "Cheerio HTML Parser" node to your workflow
2. Input the HTML content you want to parse
3. Add one or more selectors with:
   - **Name**: A unique identifier for this selector result
   - **CSS Selector**: The CSS selector to find elements (e.g., "div.content", "p.title", "#main")
   - **Attribute** (optional): Extract a specific attribute instead of text content
   - **Return Single Item**: Choose whether to return the first match or all matches
4. Optionally specify elements to remove before parsing (e.g., "script, style, nav, footer")
5. Connect the node to your workflow

## Example

Input HTML:
```html
<div class="content">
  <h1>Title</h1>
  <p>Some text</p>
</div>
```

With selector: `.content h1` the node will return:
```json
{
  "results": {
    "title": "Title"
  },
  "totalElements": 1,
  "selectors": 1
}
```

## Complete Example

Input HTML:
```html
<div class="article">
  <h1 class="title">Welcome to my blog</h1>
  <div class="content">
    <p>First paragraph of content</p>
    <p>Second paragraph of content</p>
  </div>
</div>
```

Node Configuration:
```json
{
  "selectors": [
    {
      "name": "title",
      "selector": "h1.title",
      "singleItem": true
    },
    {
      "name": "paragraphs",
      "selector": "div.content p",
      "singleItem": false
    }
  ]
}
```

Output:
```json
{
  "results": {
    "title": "Welcome to my blog",
    "paragraphs": [
      "First paragraph of content",
      "Second paragraph of content"
    ]
  },
  "totalElements": 3,
  "selectors": 2
}
```

## Advanced Example with Element Removal

Input HTML:
```html
<html>
  <head>
    <script>console.log('analytics');</script>
    <style>.hidden { display: none; }</style>
  </head>
  <body>
    <nav>Navigation Menu</nav>
    <main>
      <h1 class="title">Article Title</h1>
      <div class="content">
        <p>Main content here</p>
      </div>
    </main>
    <footer>Footer content</footer>
  </body>
</html>
```

Node Configuration:
```json
{
  "removeElements": "script, style, nav, footer",
  "selectors": [
    {
      "name": "title",
      "selector": "h1.title",
      "singleItem": true
    },
    {
      "name": "content",
      "selector": "div.content p",
      "singleItem": true
    },
    {
      "name": "titleClass",
      "selector": "h1.title",
      "attribute": "class",
      "singleItem": true
    }
  ]
}
```

Output:
```json
{
  "results": {
    "title": "Article Title",
    "content": "Main content here",
    "titleClass": "title"
  },
  "totalElements": 3,
  "selectors": 3
}
```

**Note**: The `script`, `style`, `nav`, and `footer` elements were removed before parsing, so they don't interfere with the content extraction.

## Node Structure

The node outputs an object with the following structure:
- `results`: An object containing the extracted data, with keys matching the selector names
- `totalElements`: The total number of elements found across all selectors
- `selectors`: The number of selectors that were processed

## Development

To run tests:
```bash
npm test
```

## License

[MIT](LICENSE)
