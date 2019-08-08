export default class CSSRule {
	public children: CSSRule[] = [];
	public selector: string = null;
	public css: string = null;
	public startIndex: number = 0;
	public endIndex: number = 0;
}
