import { IExecuteFunctions, INodeType, NodeOperationError } from 'n8n-workflow';
import { CheerioParser } from './CheerioParser.node';

interface TestResult {
	results: { [key: string]: string | string[] };
	totalElements: number;
	selectors: number;
}

describe('CheerioParser', () => {
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

	describe('Node Description', () => {
		it('should have basic properties', () => {
			expect(node.description).toBeDefined();
			expect(node.description.displayName).toBe('Cheerio HTML Parser');
			expect(node.description.name).toBe('cheerioParser');
			expect(node.description.group).toEqual(['transform']);
			expect(node.description.version).toBe(1);
		});

		it('should have required properties', () => {
			const properties = node.description.properties;
			expect(properties).toBeDefined();
			expect(properties.length).toBe(2);
			
			// HTML input property
			const htmlProp = properties[0];
			expect(htmlProp.name).toBe('html');
			expect(htmlProp.required).toBe(true);
			
			// Selectors property
			const selectorsProp = properties[1];
			expect(selectorsProp.name).toBe('selectors');
			expect(selectorsProp.type).toBe('fixedCollection');
		});
	});

	describe('Execution', () => {
		it('should parse single elements', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return testHtml;
					if (param === 'selectors.selectorValues') {
						return [{
							name: 'title',
							selector: 'h1.title',
							singleItem: true
						}];
					}
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			const result = await node.execute!.call(context);
			expect(result).toBeDefined();
			const data = result![0][0].json as unknown as TestResult;
			expect(data.results.title).toBe('<h1 class="title">Main Title</h1>');
			expect(data.totalElements).toBe(1);
		});

		it('should parse multiple elements', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return testHtml;
					if (param === 'selectors.selectorValues') {
						return [{
							name: 'items',
							selector: 'span.item',
							singleItem: false
						}];
					}
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			const result = await node.execute!.call(context);
			expect(result).toBeDefined();
			const data = result![0][0].json as unknown as TestResult;
			expect(Array.isArray(data.results.items)).toBe(true);
			expect((data.results.items as string[]).length).toBe(3);
			expect(data.totalElements).toBe(3);
		});

		it('should handle multiple selectors', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return testHtml;
					if (param === 'selectors.selectorValues') {
						return [
							{
								name: 'title',
								selector: 'h1.title',
								singleItem: true
							},
							{
								name: 'paragraphs',
								selector: 'p',
								singleItem: false
							}
						];
					}
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			const result = await node.execute!.call(context);
			expect(result).toBeDefined();
			const data = result![0][0].json as unknown as TestResult;
			expect(data.results.title).toBe('<h1 class="title">Main Title</h1>');
			expect(Array.isArray(data.results.paragraphs)).toBe(true);
			expect((data.results.paragraphs as string[]).length).toBe(2);
			expect(data.totalElements).toBe(3);
		});

		it('should handle no matches', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return testHtml;
					if (param === 'selectors.selectorValues') {
						return [{
							name: 'nonexistent',
							selector: '.does-not-exist',
							singleItem: true
						}];
					}
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			const result = await node.execute!.call(context);
			expect(result).toBeDefined();
			const data = result![0][0].json as unknown as TestResult;
			expect(data.results.nonexistent).toBe('');
			expect(data.totalElements).toBe(0);
		});

		it('should throw error when no selectors are provided', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return testHtml;
					if (param === 'selectors.selectorValues') return [];
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			await expect(node.execute!.call(context)).rejects.toThrow(NodeOperationError);
		});

		it('should handle empty HTML', async () => {
			const context = {
				getNodeParameter: (param: string, _itemIndex: number) => {
					if (param === 'html') return '';
					if (param === 'selectors.selectorValues') {
						return [{
							name: 'title',
							selector: 'h1',
							singleItem: true
						}];
					}
					return undefined;
				},
				getInputData: () => [{}],
				getNode: () => ({ name: 'test', type: 'test', typeVersion: 1 }),
				continueOnFail: () => false,
			} as unknown as IExecuteFunctions;

			const result = await node.execute!.call(context);
			expect(result).toBeDefined();
			const data = result![0][0].json as unknown as TestResult;
			expect(data.results.title).toBe('');
			expect(data.totalElements).toBe(0);
		});
	});
});
