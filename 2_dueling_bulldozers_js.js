var WebSocket = require('ws');

var STOCK = "MWI";
var EXCHANGE = "TMIEX";
var ACCOUNT = "MFB72688183";

var AUTHORIZATION_KEY = 'f37708fd10b59ebde07ef7376885f2f4f27f29cd';


var ws = new WebSocket('wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK);
var unirest = require('unirest');


var MAX_STOCK_AMT = 900;
var MIN_STOCK_AMT = -900;

var MAX_BUY_OR_SELL = 150;

var MINIMUM_MARKET_MARGIN = 25;

var currentMarketMargin = null;
var lastMarketMargin = null;

var myStockHeld = 0;
var myMoneyHeld = 0;
var myLastSellPrice = null;

var myNetValue = null;

var myLastAskAmount = null;
var myLastBidAmount = null;

var myCurrentAskAmount = null;
var myCurrentBidAmount = null;

var myCurrentBidPrice = null;
var myCurrentAskPrice = null;

var myLastAskPrice = null;
var myLastBidPrice = null;

var lastStockData = null;

var latestQuote = null;

var lastSellPriceSize1 = null;
var lastSellPriceSize10 = null;
var lastSellPriceSize50 = null;
var lastSellPriceSize100 = null;

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
var PRICE_DEPTH_2 = 250;
var PRICE_DEPTH_3 = 1000;

var DEPTH_1_CAP = 50
var DEPTH_2_CAP = 100
var DEPTH_3_CAP = 200

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

  //console.log("price:" + price);

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

  //console.log("" + PRICE_DEPTH_3 + " in: " + currentMarketBidPriceDepth3);
  //console.log("" + PRICE_DEPTH_2 + " in: " + currentMarketBidPriceDepth2);
  //console.log("" + PRICE_DEPTH_1 + " in: " +  currentMarketBidPriceDepth1);
   console.log("my bid: " + myCurrentBidPrice + " @ " + myCurrentBidAmount);
  console.log("LAST BID: " + lastMarketBidPrice);
  //console.log("buy desire: " + buyDesire());
  //console.log("last sell(10): " + lastSellPriceSize10);

  //console.log("sell desire: " + sellDesire());
  console.log("LAST ASK: " + lastMarketAskPrice);
   console.log("my ask: " + myCurrentAskPrice + " @ " + myCurrentAskAmount);
  //console.log("" + PRICE_DEPTH_1 + " in: " + currentMarketAskPriceDepth1);
  //console.log("" + PRICE_DEPTH_2 + " in: " + currentMarketAskPriceDepth2);
  //console.log("" + PRICE_DEPTH_3 + " in: " + currentMarketAskPriceDepth3);
  console.log("--");
  console.log("stock held: " + myStockHeld);
  console.log("net value: " + myNetValue);
  console.log("-------");
  console.log("       ");

  for (orderID in myOrders) {
    cancel(myOrders[orderID]);
  }

  unirest.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/quote").
   end(updateQuote);

  unirest.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK)
  .end(function (response) {

    stockData = response.body;

    if (stockData['ok']) {

    parseStockData(stockData);

    myCurrentBidPrice = null
    myCurrentAskPrice = null
    myCurrentBidAmount = null
    myCurrentAskAmount = null

    var suggestedBidPrice = bidPrice2();
    var suggestedAskPrice = askPrice2();

    if (currentMarketMargin != null && currentMarketMargin >= MINIMUM_MARKET_MARGIN) {
    if (suggestedBidPrice != null) {
      myCurrentBidPrice = suggestedBidPrice
      myLastBidPrice = myCurrentBidPrice
      myCurrentBidAmount = bidAmount();
      myLastBidAmount = myCurrentBidAmount;
      postOrder('buy','limit', myLastBidAmount, suggestedBidPrice);
    }

   
    if (suggestedAskPrice != null) {
      myCurrentAskPrice = suggestedAskPrice
      myLastAskPrice = myCurrentAskPrice
      myCurrentAskAmount = askAmount();
      myLastAskAmount = myCurrentAskAmount;
      postOrder('sell','limit', myLastAskAmount, myLastAskPrice);
    }

  } else {
    if (currentMarketMargin == null) {
      console.log("Either no sellers or no bidders currently.");
    } else {
      console.log("Current market margin is too low to be worth participating in (" + currentMarketMargin + ")");
    }
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

   currentMarketBidPriceDepth1 = null
   currentMarketBidPriceDepth2 = null
   currentMarketBidPriceDepth3 = null

   currentMarketAskPriceDepth1 = null
   currentMarketAskPriceDepth2 = null
   currentMarketAskPriceDepth3 = null


   var quantitySoFarBids = 0;
  
  //Check out bid price depths on current books
   for (bid_index in stockData["bids"]) {
    bid = stockData["bids"][bid_index]
    if (! isOneOfMyOrders(bid)) {
    var quantityBefore = quantitySoFarBids
    quantitySoFarBids = quantitySoFarBids + bid["qty"]
    var quantityAfter = quantitySoFarBids

    if (quantityBefore < PRICE_DEPTH_1 && quantityAfter >= PRICE_DEPTH_1) {
      currentMarketBidPriceDepth1 = bid["price"];
      lastMarketBidPriceDepth1 =  currentMarketBidPriceDepth1
    }
    if (quantityBefore < PRICE_DEPTH_2 && quantityAfter >= PRICE_DEPTH_2) {
      currentMarketBidPriceDepth2 = bid["price"];
      lastMarketBidPriceDepth2 =   currentMarketBidPriceDepth2 = bid["price"]
    }  
    if (quantityBefore < PRICE_DEPTH_3 && quantityAfter >= PRICE_DEPTH_3) {
      currentMarketBidPriceDepth3 = bid["price"];
      lastMarketBidPriceDepth3 = currentMarketBidPriceDepth3;
    }
    }
  }

  var quantitySoFarAsks = 0;
   //Check out ask price depths on current books
   //console.log(stockData);
   for (ask_index in stockData["asks"]) {
   /// console.log("ask number: " + ask_index)
   // console.log("Checking ask # " + ask_index + " in current book");
    ask = stockData["asks"][ask_index]
   // console.log(ask)
    if (! isOneOfMyOrders(ask)) {

   //console.log("Not one of my orders");
    var quantityBefore = quantitySoFarAsks
   //console.log("BEFORE: " + quantityBefore)
    quantitySoFarAsks = quantitySoFarAsks + ask["qty"]
   // console.log("Quantity so far is " + quantitySoFarAsks);
    var quantityAfter = quantitySoFarAsks
   //console.log("AFTER: " + quantityAfter)

    if (quantityBefore < PRICE_DEPTH_1 && quantityAfter >= PRICE_DEPTH_1) {
      currentMarketAskPriceDepth1 = ask["price"];
      lastMarketAskPriceDepth1 =  currentMarketAskPriceDepth1
   //   console.log("last Ask Depth 1 is " + lastMarketAskPriceDepth1);
   //  console.log("Set an ask price depth 1:" + ask["price"]);
    } 
    if (quantityBefore < PRICE_DEPTH_2 && quantityAfter >= PRICE_DEPTH_2) {
   //  console.log("Set an ask price depth 2:" + ask["price"]);
      currentMarketAskPriceDepth2 = ask["price"];
    //    console.log("DEPTH 2 FOR ASK PRICE IS BEING ASSIGNED MY MAN!!!" + currentMarketAskPriceDepth2);
      lastMarketAskPriceDepth2 =  currentMarketAskPriceDepth2;
    } 
    if (quantityBefore < PRICE_DEPTH_3 && quantityAfter >= PRICE_DEPTH_3) {
    //  console.log("Set an ask price depth 3:" + ask["price"]);
      currentMarketAskPriceDepth3 = ask["price"];
      lastMarketAskPriceDepth3 = currentMarketAskPriceDepth3;
    }
  } else {
   //console.log("skip it, it's mine")
  }
  }

  console.log("FINAL # of ASK SHARES: " + quantitySoFarAsks);

  
   if (stockData["bids"] && stockData["bids"][0]) {
   var currentMarketBidPrice = stockData["bids"][0]["price"]
   }
   if (stockData["asks"] && stockData["asks"][0]) {
   var currentMarketAskPrice = stockData["asks"][0]["price"]
   }  

   if (currentMarketAskPrice && currentMarketBidPrice) {
   currentMarketMargin = currentMarketAskPrice - currentMarketBidPrice;
   lastMarketMargin = currentMarketMargin;
 }
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

function isOneOfMyOrders(orderInQuestion) {
  for (order_index in myOrders) {
    if (orderInQuestion["id"] == myOrders[order_index]["id"]) {
      return true;
    }
  }

  return false;
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
  return Math.round(MAX_BUY_OR_SELL * buyDesire());
}

function askAmount() {
  return Math.round(MAX_BUY_OR_SELL * sellDesire());
}

function betterThanAmount() {
  return 2;
}

function historicalPriceBuffer() {
  return 300;
}

function bidPrice2() {
  if (buyDesire() < .3 && currentMarketBidPriceDepth3 != null) {
    return currentMarketBidPriceDepth3 + betterThanAmount();
      console.log("Bidding at depth 3")
  } else if (buyDesire() < .7 && currentMarketBidPriceDepth2 != null) {
    console.log("Bidding at depth 2")
    return Math.min(lastSellPriceSize50 - DEPTH_2_CAP, currentMarketBidPriceDepth2 + betterThanAmount());
  } else if (buyDesire() >= .7 && currentMarketBidPriceDepth1 != null) {
    return currentMarketBidPriceDepth1 + betterThanAmount();
      console.log("Bidding at depth 1")
  }

 if (buyDesire() > .4) {
    console.log("Bidding far from last sell price")
    return Math.min(lastSellPriceSize10, lastSellPriceSize50) - historicalPriceBuffer();
  } 

  console.log("NOT bidding")
  return null;
}

function askPrice2() {
  if (sellDesire() < .3 && currentMarketAskPriceDepth3 != null) {
      console.log("Asking at depth 3")
    return currentMarketAskPriceDepth3 - betterThanAmount();
  } else if (sellDesire() < .7 && currentMarketAskPriceDepth2 != null) {
      console.log("Asking at depth 2")
    return Math.max(lastSellPriceSize50 + DEPTH_2_CAP, currentMarketAskPriceDepth2 - betterThanAmount());
  } else if (sellDesire() >= .7 && currentMarketAskPriceDepth1 != null) {
      console.log("Asking at depth 1")
    return currentMarketAskPriceDepth1 - betterThanAmount();
  }

   if (sellDesire() > .4) {
    console.log("Asking far from last sell price")
    return Math.max(lastSellPriceSize10, lastSellPriceSize50) + historicalPriceBuffer();
  } 

    console.log("NOT asking")
  return null;
}

function bidPrice() {
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

function askPrice() {
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

function updateQuote(response) {
  latestQuote = response.body;
  last = latestQuote["last"]
  lastSize = latestQuote["lastSize"]

  if (last >= 100) {
    lastSellPriceSize100 = last;
  }
  if (last >= 50) {
    lastSellPriceSize50 = last;
  }

  if (last >= 10) {
    lastSellPriceSize10 = last;
  }

  if (last >= 1) {
    lastSellPriceSize1 = last;
  }
}

checkThenReact();