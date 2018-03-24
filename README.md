# Map Simulator!

### How to build a map (very artisanal, sorry about that...)

1) Create a file **Map\<Id>.js** (see the file **data/MapTemplate.js.txt**).
2) Add restaurants with the following format:
```
{
	name: string,
	position: [x: number, y: number],
	labelDirection: 'top' | 'bottom'
}
```
3) Set **BUILDER = true** in **App.js**.
4) Use the onclick event (*normal = add node, altKey = delete node, ctrlKey = select node, shiftKey = add connections*) to draw a graph.
5) In the debug console (F12), print and copy the value of window.graph and window.graphLines. Add these values in the  **Map\<Id>.js** file.