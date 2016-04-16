#Remember, you can use any language to talk to the API.  I like Ruby so I'll use it.

require 'httparty'
require 'rubygems'
require 'websocket-client-simple'


STOCK = "BOI"
EXCHANGE = "SIPEX"
ACCOUNT = "TDB87994864"

BID_AMT = 60
ASK_AMT = 40

BID_BELOW_NUM = 40
ASK_ABOVE_NUM = 60

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
    			:headers => { 'X-Starfighter-Authorization' => '3a16e84fe1bf94073c274c9d1f9f9e4f6daf0844' } )
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
    	:headers => { 'X-Starfighter-Authorization' => '3a16e84fe1bf94073c274c9d1f9f9e4f6daf0844' } )
	puts result
	$my_orders.push(result)
end


while true
	puts "------------start--------------"
	puts "retrieving best bids & asks..."
	response = HTTParty.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK)


	orderbook = response.parsed_response

	puts orderbook["ok"]
	# true

	puts "BEST BID:"
	if orderbook["bids"]
		puts orderbook["bids"][NEXT_BEST_NUM]
		best_bid = orderbook["bids"][NEXT_BEST_NUM]
	else 
		puts "No bids?"
		best_bid = nil
	end

	puts "BEST ASK:"
	if orderbook["asks"]
		puts orderbook["asks"][NEXT_BEST_NUM]
		best_ask = orderbook["asks"][NEXT_BEST_NUM]
	else
		puts "No asks?"
		best_ask = nil
	end

	puts "- - - - - "
	puts "cancelling orders..."

	for order in $my_orders
		cancel(order)
	end

	puts "----------"
	puts "posting bids & asks..."

	if best_bid 
		postOrder('buy','limit', BID_AMT, best_bid["price"] - BID_BELOW_NUM)
	end

	puts "- - - - - "

	if best_ask
		postOrder('sell','limit', ASK_AMT, best_ask["price"] + ASK_ABOVE_NUM)
	end
	puts "==============end==========="
	puts "   "
	puts "   "
end 

