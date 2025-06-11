# n8n-nodes-cheerio-parser

This is a custom n8n node that uses Cheerio to parse HTML content.
## Features

- Parse HTML using multiple CSS selectors
- Convert selected output to array or string

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
npm link n8n-nodes-cheerio-parser
```

## Usage

1. Add the "Cheerio Parser" node to your workflow
2. Input the HTML content you want to parse
3. Specify a CSS selector (e.g., "div.content", "p.title", "#main")
4. Choose your desired output type (single or array)
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
  "result": "Title"
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
  "total": {
    "selectors": 2,
    "elements": 3
  }
}
```

## Development

To run tests:
```bash
npm test
```

## License

[MIT](LICENSE)
