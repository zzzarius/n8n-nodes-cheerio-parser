import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IDataObject,
} from "n8n-workflow";
import * as cheerio from "cheerio";

interface SelectorItem {
  name: string;
  selector: string;
  attribute?: string;
  singleItem: boolean;
}

interface ExecutionResults extends IDataObject {
  results: { [key: string]: string | string[] };
  totalElements: number;
  selectors: number;
}

export class CheerioParser implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Cheerio HTML Parser",
    name: "cheerioParser",
    icon: "file:cheerio.svg",
    group: ["transform"],
    version: 1,
    description: "Parse HTML using Cheerio",
    defaults: {
      name: "Cheerio Parser",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "HTML",
        name: "html",
        type: "string",
        default: "",
        placeholder: "<div>Example HTML</div>",
        description: "The HTML to parse",
        required: true,
      },
      {
        displayName: "Selectors",
        name: "selectors",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
          sortable: true,
        },
        placeholder: "Add Selector",
        default: {},
        options: [
          {
            name: "selectorValues",
            displayName: "Selector",
            values: [
              {
                displayName: "Name",
                name: "name",
                type: "string",
                default: "",
                placeholder: "title",
                description: "Name for this selector",
                required: true,
              },
              {
                displayName: "CSS Selector",
                name: "selector",
                type: "string",
                default: "",
                placeholder: "h1.title",
                description: "CSS selector to find elements",
                required: true,
              },
              {
                displayName: "Attribute",
                name: "attribute",
                type: "string",
                default: "",
                placeholder: "class",
                description:
                  "Attribute to extract. If not provided, the entire element will be returned",
                required: false,
              },
              {
                displayName: "Return Single Item",
                name: "singleItem",
                type: "boolean",
                default: false,
                description:
                  "Whether to return only the first matching element",
              },
            ],
          },
        ],
        description: "The CSS selectors to use",
      },
    ],
  };

  async execute(
    this: IExecuteFunctions
  ): Promise<INodeExecutionData[][] | null> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const html = this.getNodeParameter("html", i) as string;
        const selectorsData = this.getNodeParameter(
          "selectors.selectorValues",
          i,
          []
        ) as SelectorItem[];

        if (selectorsData.length === 0) {
          throw new NodeOperationError(
            this.getNode(),
            "At least one selector is required"
          );
        }

        const $ = cheerio.load(html);
        const results: { [key: string]: string | string[] } = {};
        let totalElements = 0;

        for (const selectorData of selectorsData) {
          const { name, selector, singleItem, attribute } = selectorData;
          const $elements = $(selector);
          const elements: string[] = [];

          $elements.each((_, el) => {
            if (attribute) {
              const value = $(el).attr(attribute);
              if (value) {
                elements.push(value);
              }
            } else {
              elements.push($.html(el));
            }
          });

          results[name] = singleItem ? elements[0] || "" : elements;
          totalElements += elements.length;
        }

        const executionResults: ExecutionResults = {
          results,
          totalElements,
          selectors: selectorsData.length,
        };

        returnData.push({
          json: executionResults,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new NodeOperationError(
            this.getNode(),
            `HTML parsing failed: ${error.message}`
          );
        }
        throw new NodeOperationError(
          this.getNode(),
          "HTML parsing failed with an unknown error"
        );
      }
    }

    return [returnData];
  }
}
