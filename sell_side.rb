#Remember, you can use any language to talk to the API.  I like Ruby so I'll use it.

require 'httparty'


STOCK = "CCH"
EXCHANGE = "CUFDEX"
ACCOUNT = "HAP72884192"

BID_AMT = 80
ASK_AMT = 80

BID_BELOW_NUM = 110
BID_ABOVE_NUM = 110

NEXT_BEST_NUM = 3

$my_orders = []

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
		postOrder('sell','limit', ASK_AMT, best_ask["price"] + BID_ABOVE_NUM)
	end
	puts "==============end==========="
	puts "   "
	puts "   "
end 

