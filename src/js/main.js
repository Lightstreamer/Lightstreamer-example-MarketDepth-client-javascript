/*
  Copyright (c) Lightstreamer Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Lightstreamer MarketDepth Demo
// Market Data Management

var client = null;

var sellSubscription = null;

var buySubscription = null;

// cell highlighting time (milliseconds)
var hotTime = 350;

// Lightstreamer Subscriptions objects
var summarySub = null;
var buySideSub = null;
var sellSideSub = null;

function selectChange() {
	var var1 = document.getElementById("qtyN");
	var var2 = document.getElementById("pxN");
	
	var1.value = '';
	var2.value = '';
	
	if (summarySub) {
		client.unsubscribe(summarySub);
		summarySub.setItems([document.getElementById("stockN").value]);
		client.subscribe(summarySub);
	}
	if (buySideSub) {
		client.unsubscribe(buySideSub);
		buySideSub.setItems([document.getElementById("stockN").value+"_BUYSIDE"]);
		client.subscribe(buySideSub);
	}
	if (sellSideSub) {
		client.unsubscribe(sellSideSub);
		sellSideSub.setItems([document.getElementById("stockN").value+"_SELLSIDE"]);
		client.subscribe(sellSideSub);
	}
}

require(["js/lsClient","StaticGrid","Subscription"],function(lsClient,StaticGrid,Subscription) {
	
	var stockname = document.getElementById("stockN").value;
	
	client = lsClient;
	
	lsClient.addListener({
		onStatusChange: function(newStatus) {
			if (newStatus.indexOf("CONNECTED") == 0) {
				document.getElementById("buy").disabled = false;
				document.getElementById("sell").disabled = false;
			} else {
				document.getElementById("buy").disabled = true;
				document.getElementById("sell").disabled = true;
			}
		}
	});
	
	var myGrid = new StaticGrid("Sintesi",true);
	
	myGrid.setAutoCleanBehavior(true, false);
	myGrid.addListener({
		onVisualUpdate: function(key,info) {
			if (info == null) {
				//cleaning
				return;
			}
			
			if (info.getChangedFieldValue("trading_phase") == "Trading") {
				info.setCellAttribute("trading_phase","green", "green", "backgroundColor");
				info.setCellAttribute("trading_phase","white", "white", "color");
			} else if (info.getChangedFieldValue("trading_phase") == "End Of Day") {
				info.setCellAttribute("trading_phase","red", "red", "backgroundColor");
				info.setCellAttribute("trading_phase","white", "white", "color");
			} else if (info.getChangedFieldValue("trading_phase") == "Opening Auction") {
				info.setCellAttribute("trading_phase","orange", "orange", "backgroundColor");
				info.setCellAttribute("trading_phase","black", "black", "color");
			}
			
			var last = info.getChangedFieldValue("last");
			
			if (last != null) {
				var d = new Date(+last);
				info.setCellValue("last", d.toLocaleString());
			}
			
			info.setAttribute("yellow", "", "backgroundColor");
		},
		onSubscriptionError: function(code, message) {
			console.error(message+"!!!!!!!!!!!!!!!!!!!!!!");
		}
		});
		
	var mySubscription = new Subscription("MERGE",[stockname],myGrid.extractFieldList());

	mySubscription.setRequestedSnapshot("yes");
	mySubscription.addListener(myGrid);
	
	lsClient.subscribe(mySubscription);
	
	summarySub = mySubscription;
	
}); 
 
require(["js/lsClient","Subscription","DynaGrid"], function(lsClient,Subscription,DynaGrid) {

	// BUY side subscription:

	var buyGrid = new DynaGrid("buyside",true);
	buyGrid.setAutoCleanBehavior(true,false);
	buyGrid.setSort("key",true,true);
	// buyGrid.setMaxDynaRows(15);
	// buyGrid.setAutoScroll("PAGE", "buy-elemet");
	buyGrid.addListener({
		onVisualUpdate: function(key,info) {
			if (info == null) {
				return;
			}
			// visual effects on updates
			info.setHotTime(hotTime);
			info.setStyle("lshotB", "lscoldB");
			info.setCellStyle("command", "commandhot", "commandcold")
		}
	});

	buySubscription = new Subscription("COMMAND","AXY_COMP_BUYSIDE",["command", "key", "qty"]);
	
	buySubscription.setRequestedSnapshot("yes");

	buySubscription.addListener(buyGrid);
	buySubscription.addListener({
		onClearSnapshot: function(itemName,itemPos) {
			console.info("Clear Snapshot: " + itemName + ".");
		},
		onItemLostUpdates: function(itemName, itemPos, lostUpdates) {
			console.error("Lost Updates for " + itemName + ": " + lostUpdates);
			
			// Unsubcribe and then subscribe again the Item in order that the snapshot restore the list.
			
			client.unsubscribe(buySubscription);
			client.subscribe(buySubscription);
		}
	});
	lsClient.subscribe(buySubscription);
	
	buySideSub = buySubscription;
	
	// SELL side subscription:
	
	var sellGrid = new DynaGrid("sellside",true);
	sellGrid.setAutoCleanBehavior(true,false);
	sellGrid.setSort("key",false, true);
	sellGrid.addListener({
		onVisualUpdate: function(key,info) {
			if (info == null) {
				return;
			}
			// visual effects on updates
			info.setHotTime(hotTime);
			info.setStyle("lshotS", "lscoldS");
			info.setCellStyle("command", "commandhot", "commandcold")
		}
	});

	sellSubscription = new Subscription("COMMAND","AXY_COMP_SELLSIDE",["command", "key", "qty"]);
	
	sellSubscription.setRequestedSnapshot("yes");

	sellSubscription.addListener(sellGrid);
	sellSubscription.addListener({
		onClearSnapshot: function(itemName,itemPos) {
			console.info("Clear Snapshot: " + itemName + ".");
		},
		onItemLostUpdates: function(itemName, itemPos, lostUpdates) {
			console.error("Lost Updates for " + itemName + ": " + lostUpdates);
			
			// Unsubcribe and then subscribe again the Item in order that the snapshot restore the list.
			
			client.unsubscribe(sellSubscription);
			client.subscribe(sellSubscription);
		}
	});
	lsClient.subscribe(sellSubscription);
	
	sellSideSub = sellSubscription;
});