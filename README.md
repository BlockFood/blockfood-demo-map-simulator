
# Map Simulator!

### Try

```
npm install
npm start
```

### Component

The component **Map** and the dependencies are in the folder **map/**.

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
3) Import **Map\<Id>.js** in **App.js**, set **ACTIVE_MAP = Map\<Id>** and set **BUILDER = true**.
4) Use the onclick event (*normal = add node, altKey = delete node, ctrlKey = select node, shiftKey = add connections*) to draw a graph.
5) In the debug console (*F12*), print and copy the value of **window.graph**. Add these values in the  **Map\<Id>.js** file.