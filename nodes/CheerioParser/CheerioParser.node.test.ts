import {
  type IExecuteFunctions,
  type INodeType,
  NodeOperationError,
} from "n8n-workflow";
import { CheerioParser } from "./CheerioParser.node";

interface TestResult {
  results: { [key: string]: string | string[] };
  totalElements: number;
  selectors: number;
}

describe("CheerioParser", () => {
  let node: INodeType;
  let testHtml: string;

  beforeEach(() => {
    node = new CheerioParser();
    testHtml = `
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <div class="container">
            <h1 class="title">Main Title</h1>
            <div class="content">
              <p>First paragraph</p>
              <p>Second paragraph</p>
            </div>
            <div class="items">
              <span class="item">Item 1</span>
              <span class="item">Item 2</span>
              <span class="item">Item 3</span>
            </div>
          </div>
        </body>
      </html>
    `;
  });

  describe("Node Description", () => {
    it("should have basic properties", () => {
      expect(node.description).toBeDefined();
      expect(node.description.displayName).toBe("Cheerio HTML Parser");
      expect(node.description.name).toBe("cheerioParser");
      expect(node.description.group).toEqual(["transform"]);
      expect(node.description.version).toBe(1);
    });

    it("should have required properties", () => {
      const properties = node.description.properties;
      expect(properties).toBeDefined();
      expect(properties.length).toBe(3);

      // HTML input property
      const htmlProp = properties[0];
      expect(htmlProp.name).toBe("html");
      expect(htmlProp.required).toBe(true);

      // Selectors property
      const selectorsProp = properties[1];
      expect(selectorsProp.name).toBe("selectors");
      expect(selectorsProp.type).toBe("fixedCollection");

      // Remove Elements property
      const removeElementsProp = properties[2];
      expect(removeElementsProp.name).toBe("removeElements");
      expect(removeElementsProp.type).toBe("string");
    });
  });

  describe("Execution", () => {
    it("should parse single elements", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "title",
                selector: "h1.title",
                singleItem: true,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.title).toBe("Main Title");
      expect(data.totalElements).toBe(1);
    });

    it("should parse multiple elements", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "items",
                selector: "span.item",
                singleItem: false,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(Array.isArray(data.results.items)).toBe(true);
      expect((data.results.items as string[]).length).toBe(3);
      expect(data.totalElements).toBe(3);
    });

    it("should handle multiple selectors", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "title",
                selector: "h1.title",
                singleItem: true,
              },
              {
                name: "paragraphs",
                selector: "p",
                singleItem: false,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.title).toBe("Main Title");
      expect(Array.isArray(data.results.paragraphs)).toBe(true);
      expect((data.results.paragraphs as string[]).length).toBe(2);
      expect(data.totalElements).toBe(3);
    });

    it("should handle no matches", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "nonexistent",
                selector: ".does-not-exist",
                singleItem: true,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.nonexistent).toBe("");
      expect(data.totalElements).toBe(0);
    });

    it("should throw error when no selectors are provided", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") return [];
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      await expect(node.execute?.call(context)).rejects.toThrow(
        NodeOperationError,
      );
    });

    it("should handle empty HTML", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return "";
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "title",
                selector: "h1",
                singleItem: true,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.title).toBe("");
      expect(data.totalElements).toBe(0);
    });

    it("should extract single attribute value", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "titleClass",
                selector: "h1",
                attribute: "class",
                singleItem: true,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.titleClass).toBe("title");
      expect(data.totalElements).toBe(1);
    });

    it("should extract multiple attribute values", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "itemClasses",
                selector: "span",
                attribute: "class",
                singleItem: false,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(Array.isArray(data.results.itemClasses)).toBe(true);
      expect(data.results.itemClasses as string[]).toEqual([
        "item",
        "item",
        "item",
      ]);
      expect(data.totalElements).toBe(3);
    });

    it("should handle non-existent attributes", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return testHtml;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "nonExistentAttr",
                selector: "h1",
                attribute: "data-test",
                singleItem: true,
              },
            ];
          }
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.nonExistentAttr).toBe("");
      expect(data.totalElements).toBe(0);
    });

    it("should remove unwanted elements before parsing", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return `\n        <html>\n          <body>\n            <script>console.log('bad')</script>\n            <style>.hidden{}</style>\n            <nav>Navigation</nav>\n            <footer>Footer</footer>\n            <div class='main'>Content</div>\n          </body>\n        </html>\n      `;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "mainContent",
                selector: ".main",
                singleItem: true,
              },
              {
                name: "script",
                selector: "script",
                singleItem: true,
              },
              {
                name: "footer",
                selector: "footer",
                singleItem: true,
              },
            ];
          }
          if (param === "removeElements") return "script, style, nav, footer";
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.mainContent).toBe("Content");
      expect(data.results.script).toBe("");
      expect(data.results.footer).toBe("");
      expect(data.totalElements).toBe(1);
    });

    it("should do nothing if removeElements is empty", async () => {
      const context = {
        getNodeParameter: (param: string, _itemIndex: number) => {
          if (param === "html") return `\n        <html>\n          <body>\n            <script>console.log('bad')</script>\n            <div class='main'>Content</div>\n          </body>\n        </html>\n      `;
          if (param === "selectors.selectorValues") {
            return [
              {
                name: "script",
                selector: "script",
                singleItem: true,
              },
              {
                name: "mainContent",
                selector: ".main",
                singleItem: true,
              },
            ];
          }
          if (param === "removeElements") return "";
          return undefined;
        },
        getInputData: () => [{}],
        getNode: () => ({ name: "test", type: "test", typeVersion: 1 }),
        continueOnFail: () => false,
      } as unknown as IExecuteFunctions;

      const result = await node.execute?.call(context);
      expect(result).toBeDefined();
      const data = result?.[0][0].json as unknown as TestResult;
      expect(data.results.script).toBe("console.log('bad')");
      expect(data.results.mainContent).toBe("Content");
      expect(data.totalElements).toBe(2);
    });
  });
});
