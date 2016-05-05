#Remember, you can use any language to talk to the API.  I like Ruby so I'll use it.

require 'httparty'
require 'rubygems'
require 'websocket-client-simple'

STOCK = "IZZ"
EXCHANGE = "HFHBEX"
ACCOUNT = "BSJ57113983"

BID_AMT = 50
ASK_AMT = 50

BID_BELOW_NUM = 50
ASK_ABOVE_NUM = 50

NEXT_BEST_NUM = 2

$my_orders = []

ws = WebSocket::Client::Simple.connect 'wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK

ws.on :message do |msg|
  puts msg.data
end

ws.on :open do
  ws.send 'hello!!!'
end

ws.on :close do |e|
  p e
  exit 1
end

ws.on :error do |e|
  p e
end

def cancel(order) 
	order_id = order["id"]
	puts "cancelling order " + order_id.to_s
	result = HTTParty.delete("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/orders/" + order_id.to_s, 
    			:headers => { 'X-Starfighter-Authorization' => 'f37708fd10b59ebde07ef7376885f2f4f27f29cd' } )
	puts result

	#delete the order from our records
	for order in $my_orders
		if order["id"] == result["id"]
			$my_orders.delete(order)
		end
	end
end

def postOrder(direction, orderType, qty, price) 
	puts "posting order"
	result = HTTParty.post("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/orders", 
   		:body => { :orderType => orderType, 
   	    	:qty => qty, 
   	    	:price => price,
            :direction => direction,
            :account => ACCOUNT, 
         }.to_json,
    	:headers => { 'X-Starfighter-Authorization' => 'f37708fd10b59ebde07ef7376885f2f4f27f29cd' } )
	puts result
	$my_orders.push(result)
end


while true
	console.log( "------------start--------------");
	console.log( "retrieving best bids & asks...");
	response = HTTParty.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK)


	orderbook = response.parsed_response

	console.log(orderbook["ok"]);
	# true

	console.log("BEST BID:")
	if orderbook["bids"]
		console.log(orderbook["bids"][NEXT_BEST_NUM])
		best_bid = orderbook["bids"][NEXT_BEST_NUM]
	else 
		console.log("No bids?")
		best_bid = nil
	end

	puts "BEST ASK:"
	if orderbook["asks"]
		console.log(orderbook["asks"][NEXT_BEST_NUM])
		best_ask = orderbook["asks"][NEXT_BEST_NUM]
	else
		console.log("No asks?")
		best_ask = nil
	end

	console.log("- - - - - ")
	console.log("cancelling orders (async)...");

	for order in $my_orders
		cancel(order)
	end

	console.log("----------")
	console.log("posting bids & asks...")

	if best_bid 
		postOrder('buy','limit', BID_AMT, best_bid["price"] - BID_BELOW_NUM)
	end

	puts "- - - - - "

	if best_ask
		postOrder('sell','limit', ASK_AMT, best_ask["price"] + ASK_ABOVE_NUM)
	end
	console.log("==============end===========");
	console.log("   ");
	console.log("   ");
end 

