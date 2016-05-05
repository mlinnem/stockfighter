var WebSocket = require('ws');

var STOCK = "MLM";
var EXCHANGE = "BLAEX";
var ACCOUNT = "YEH21524412";

var AUTHORIZATION_KEY = 'f37708fd10b59ebde07ef7376885f2f4f27f29cd';


var ws = new WebSocket('wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK);
var unirest = require('unirest');


var MAX_STOCK_AMT = 900;
var MIN_STOCK_AMT = -900;

var MAX_BUY_OR_SELL = 200;

var myStockHeld = 0;
var myMoneyHeld = 0;
var myLastSellPrice = null;

var myNetValue = null;

var myLastAskAmount = null;
var myLastBidAmount = null;

var myLastAskPrice = null;
var myLastBidPrice = null;

var lastStockData = null;

var currentMarketBidPrice = null;
var currentMarketAskPrice = null;


var currentMarketBidPriceDepth1 = null;
var currentMarketBidPriceDepth2 = null;
var currentMarketBidPriceDepth3 = null;

var lastMarketBidPriceDepth1 = null;
var lastMarketBidPriceDepth2 = null;
var lastMarketBidPriceDepth3 = null;

var currentMarketAskPriceDepth1 = null;
var currentMarketAskPriceDepth2 = null;
var currentMarketAskPriceDepth3 = null;

var lastMarketAskPriceDepth1 = null;
var lastMarketAskPriceDepth2 = null;
var lastMarketAskPriceDepth3 = null;

var PRICE_DEPTH_1 = 50;
var PRICE_DEPTH_2 = 150;
var PRICE_DEPTH_3 = 500;

var lastMarketBidPrice = null;
var lastMarketAskPrice = null;

var myOrders = [];


ws.on('open', function open() {
  ws.send('something');
});

ws.on('message', function(data, flags) {
  //console.log("bid or ask cleared. Raw data...")
  //console.log(data);

  var parsed_data = JSON.parse(data);

  if (parsed_data['ok']) {
  var order = parsed_data["order"];
  var id = order["id"];
  var price = order['price'];
  var originalQty = order['originalQty'];
  var remainingQty = order['qty'];
  var direction = order['direction'];
  var qty = originalQty - remainingQty;

  console.log("price:" + price);

  lastPrice = price

  if (direction == 'buy') {
  	console.log(id + "\t: bought " + qty + " @ " + price);
  	myMoneyHeld = myMoneyHeld - price * qty;
  	myStockHeld = myStockHeld + qty;
  } else if (direction == 'sell') {
  	console.log(id + "\t: sold " + qty + " @ " + price);
  	myMoneyHeld = myMoneyHeld + price * qty;
   // console.log("Stock held before sell:" + myStockHeld);
  	myStockHeld = myStockHeld - qty;
   //  console.log("Stock held after sell:" + myStockHeld);
  }

  printStatus()
  } else {
    console.log("Received unexpected websocket data");
    console.log(parsed_data);
  }
  // flags.binary will be set if a binary data is received.
  // flags.masked will be set if the data was masked.
});


function checkThenReact() {
  //console.log("Cancelling all orders (which are...)");
  //console.log(myOrders);

  console.log("LAST BID: " + lastMarketBidPrice);
  console.log("my bid: " + myLastBidPrice + " @ " + myLastBidAmount);
  console.log("my ask: " + myLastAskPrice + " @ " + myLastAskAmount);
  console.log("LAST ASK: " + lastMarketAskPrice);
  console.log("--");
  console.log("buy desire: " + buyDesire());
  console.log("sell desire: " + sellDesire());
  console.log("stock held: " + myStockHeld);
  console.log("net value: " + myNetValue);
  console.log("-------");
  console.log("       ");

  for (orderID in myOrders) {
    cancel(myOrders[orderID]);
  }

  unirest.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK)
  .end(function (response) {

    stockData = response.body;

    if (stockData['ok']) {

    //console.log(stockData);
    parseStockData(stockData);

    if (lastMarketBidPrice) {
    myLastBidAmount = bidAmount();
    myLastBidPrice = bidPrice();
      postOrder('buy','limit', myLastBidAmount, myLastBidPrice);
    }
    if (lastMarketAskPrice) {
    myLastAskAmount = askAmount();
    myLastAskPrice = askPrice();
    postOrder('sell','limit', myLastAskAmount, myLastAskPrice);
  }
    
    setTimeout(checkThenReact, 200);
    } else {
      console.log("Received unexpected stock data");
      console.log(stockData);
    }
    });
}

function parseStockData(stockData) {
   lastStockData = stockData

   currentMarketPriceDepth1 = null
   currentMarketPriceDepth2 = null
   currentMarketPriceDepth3 = null

   var quantitySoFar = 0
  
   for (bid_index in stockData["bids"]) {
    bid = stockData["bids"][bid_index]

    var quantityBefore = quantitySoFar
    quantitySoFar = quantitySoFar + bid["qty"]
    var quantityAfter = quantitySoFar

    if (quantityBefore < PRICE_DEPTH_1 && quantityAfter >= PRICE_DEPTH_1) {
      currentMarketBidPriceDepth1 = bid["price"];
      lastMarketBidPriceDepth1 =  currentMarketPriceDepth1
    } else if (quantityBefore < PRICE_DEPTH_2 && quantityAfter >= PRICE_DEPTH_2) {
      currentMarketBidPriceDepth2 = bid["price"];
      lastMarketBidPriceDepth2 =   currentMarketPriceDepth2 = bid["price"]
    }  else if (quantityBefore < PRICE_DEPTH_3 && quantityAfter >= PRICE_DEPTH_3) {
      currentMarketBidPriceDepth3 = bid["price"];
      lastMarketBidPriceDepth3 = currentMarketPriceDepth3;
    }
  }

   for (ask_index in stockData["asks"]) {
    ask = stockData["asks"][ask_index]

    var quantityBefore = quantitySoFar
    quantitySoFar = quantitySoFar + ask["qty"]
    var quantityAfter = quantitySoFar

    if (quantityBefore < PRICE_DEPTH_1 && quantityAfter >= PRICE_DEPTH_1) {
      currentMarketAskPriceDepth1 = ask["price"];
      lastMarketAskPriceDepth1 =  currentMarketAskPriceDepth1
    } else if (quantityBefore < PRICE_DEPTH_2 && quantityAfter >= PRICE_DEPTH_2) {
      currentMarketAskPriceDepth2 = ask["price"];
      lastMarketBidPriceDepth2 =  currentMarketAskPriceDepth2 = ask["price"]
    }  else if (quantityBefore < PRICE_DEPTH_3 && quantityAfter >= PRICE_DEPTH_3) {
      currentMarketAskPriceDepth3 = ask["price"];
      lastMarketBidPriceDepth3 = currentMarketAskPriceDepth3;
    }
  }
    
   }
   if (stockData["bids"] && stockData["bids"][1]) {
   var currentMarketBidPrice = stockData["bids"][1]["price"]
   }
   if (stockData["asks"] && stockData["asks"][1]) {
   var currentMarketAskPrice = stockData["asks"][1]["price"]
   }  

var lastMarketBidPrice20Depth = null;
var lastMarketBidPrice100Depth = null;
var lastMarketBidPrice500Depth = null;

var lastMarketAskPrice20Depth = null;
var lastMarketAskPrice100Depth = null;
var lastMarketAskPrice500Depth = null;

   if (currentMarketBidPrice) {
    lastMarketBidPrice = currentMarketBidPrice
   }
   if (currentMarketAskPrice) {
    lastMarketAskPrice = currentMarketAskPrice
   }
}

function printStatus() {
	myStockValue = 	myStockHeld * lastPrice

	//console.log( "----------")
	console.log( "stock held: " + myStockHeld)
	//console.log( "money held: " + myMoneyHeld)
	//console.log( "  ")
	//console.log( "stock value:" + myStockValue)
	//console.log( "  ")
  myNetValue = (myMoneyHeld + myStockValue) / 100;
  console.log( "==========")
	console.log( "total value:" + myNetValue);
	console.log( "  ")
	console.log( "  ")
}

function postOrder(direction, orderType, qty, price)  {
  //console.log("posting order")
  unirest.post("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/orders/")
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Starfighter-Authorization' : AUTHORIZATION_KEY })
    .send({'orderType': orderType, 'qty': qty, 'price': parseInt(price), 'direction': direction, 'account' : ACCOUNT})
    .end(function (response) {
      //TODO: Put order on my orders before we even get a response, would be cool.
        //console.log("Response to posting order...");
        //console.log(response.body)

        var new_order = response.body;
        myOrders.push(new_order);
        //console.log("new order...");
        //console.log(new_order);
    });
}

function sellDesire() {
  return (1.0 - shortStrength());
}

function buyDesire() {
  return (1.0 - longStrength());
}
function longStrength() {
  return ((myStockHeld + -MIN_STOCK_AMT) / (-MIN_STOCK_AMT + MAX_STOCK_AMT));
}

function shortStrength() {
  return 1.0 - longStrength();
}

function bidAmount() {
  if (buyDesire() > .45) {
  return 2 * Math.round(MAX_BUY_OR_SELL * buyDesire());
  } else {
  return Math.round(MAX_BUY_OR_SELL * buyDesire());
}
}

function askAmount() {
  if (sellDesire() > .45) {
  return 2 * Math.round(MAX_BUY_OR_SELL * sellDesire());
  } else {
  return Math.round(MAX_BUY_OR_SELL * sellDesire());
  }
}


function bidPrice() {
  var bidPriceValue = null
  if (buyDesire() > .9) {
  } else if (buyDesire() > .7) {
    bidPriceValue = lastMarketBidPrice;
  } else {
    bidPriceValue = lastMarketBidPrice - (200 * (1.0 - buyDesire()));
  }
  return Math.round(bidPriceValue);
}

function bidPrice1() {
  var bidPriceValue = null
  if (buyDesire() > .9) {
  bidPriceValue = lastMarketBidPrice + 2;
  } else if (buyDesire() > .7) {
    bidPriceValue = lastMarketBidPrice;
  } else {
    bidPriceValue = lastMarketBidPrice - (200 * (1.0 - buyDesire()));
  }
  return Math.round(bidPriceValue);
}

function askPrice1() {
  var askPriceValue = null
  if (sellDesire() > .9) {
  askPriceValue = lastMarketAskPrice - 2;
  } else if (sellDesire() > .7) {
    askPriceValue = lastMarketAskPrice;
  } else {
    askPriceValue = lastMarketAskPrice + (200 * (1.0 - sellDesire()));
  }

  return Math.round(askPriceValue);
}

function cancel(order) {
  //console.log("cancelling order " + order["id"]);
  //console.log("full order" + order);
  unirest.delete("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/orders/" + order["id"])
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Starfighter-Authorization' : AUTHORIZATION_KEY } )
    .end(function (response) {
      //TODO: cancellation confirmation code here
  });

  //assuming it will be cancelled right away. No confirmation
  //remove order from myOrders
   for (var i = 0; i < myOrders.length; i++) {
      if (order["id"] == myOrders[i]["id"]) {
       myOrders.splice(i, 1);
       break;
      }
  }
}

checkThenReact();