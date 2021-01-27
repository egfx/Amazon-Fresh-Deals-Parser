class AmazonParser {

  constructor(selectors){
    this.selectors = selectors;
  }

  gather(){
    let selector = Object.values(this.selectors);
    return Object.keys(this.selectors).map(function(key, index) {
      return {[key]: document.querySelectorAll(selector[index])};
    });
  }

  process(d) {
    d.forEach(function(item, index){
      for (let key in item) {
        switch(key){
          case "name":
            item[key] = Array.prototype.map.call(item[key], function(_item){
              return _item.title;
              });
              break;
          case "prices":
            item[key] = Array.prototype.map.call(item[key], function(_item){
              return _item.textContent.replace(/\s+/g, '');
              });
              break;
          case "links":
            item[key] = Array.prototype.map.call(item[key], function(_item){
                return _item.href + "&tag=ebt005-20";
              });
              break;
          case "images":
            item[key] = Array.prototype.map.call(item[key], function(_item){
                return _item.src;
              });
              break;
          case "asin":
            item[key] = Array.prototype.map.call(item[key], function(_item){
                let parser = document.createElement('a');
                parser.href = _item.href;
                let paths = parser.pathname.split("/");
                let dummyIndex = paths.indexOf("product");
                let realIndex = dummyIndex + 1;
                return paths[realIndex];
              });
              break;
        }
      }
    });
    return d;
  }

  sorter() {

    let y = [], z = [];

    const gathered = Object.entries(Object.assign(...this.process(this.gather())));
      for (const [key, value] of gathered) {
        value.forEach(function(item, index){
          y[index] = (y[index] || []).concat({[key]:item}),
            z[index] = Object.assign({}, ...y[index]);
        })
      }

    return z;
  }

  sender(deals) {
    chrome.runtime.sendMessage({method: "AmazonDeals", deals: deals}, function(response) {
      console.log("Thanks for visiting this tab!");
    });
  }

  runner() {
    const timeStamp = +new Date();
    let sorted = this.sorter();
    return new Promise(function(resolve) {
      let keeper = sorted.map(function(obj){
        let o = Object.assign({}, obj);
        o.timeStamp = timeStamp;
        return o;
      });
      resolve(keeper);
    });
  }

}

window.addEventListener ("load", () => {

  let jsInitChecktimer = setInterval (checkForJS_Finish, 111);

  async function checkForJS_Finish(){

    const data = {
      "name": ".a-dynamic-image",
      "prices": "span.a-size-base.a-color-price.kepler-widget-price",
      "links": ".a-box-group .a-spacing-top-micro > .a-link-normal",
      "images": ".a-dynamic-image",
      "asin": ".a-box-group .a-spacing-top-micro > .a-link-normal"
    }

    let parse = new AmazonParser(data);
        
    try {
      let parsedData = await parse.runner();
      clearInterval (jsInitChecktimer);
      parse.sender(parsedData);
    } catch(err){
      console.log(err);
    }
  }
}, false);
