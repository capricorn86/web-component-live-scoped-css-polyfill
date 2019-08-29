export default class CSSRule {
	public selector: string = null;
	public css: string = null;
	public startIndex: number = 0;
	public endIndex: number = 0;
	public parent: CSSRule = null;
	public hasChildren = false;
}
