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
// Order Entry Management

// cell highlighting time (milliseconds)
var hotOrdersTime = 800;

// fade effect (can be activated with trailing "fade=ON" in URL
var doOrdersFade = (location.search.indexOf("fade=ON") > -1);
var fadeOrdersTime = 300;

//////////////// Drop-down List Composition

// The list of stocks available on the market would be normally provided
// by an application server, based on some search criteria and on the user
// profile. In this sample, we will simply hard-wire on the Client the list
// of stocks managed by the QUOTE_ADAPTER Data Adapter.

var availStocks = ["AXY_COMP", "BTTQ_I", "SF_TECH", "OS_C"];

var stockNames = ["AXY Company Ltd.", "BTTQ Industries Sa", "SuperFast Tech.", "Old&Slow Company"];

// populate the HTML select element
var select = document.getElementById("stockN");
if (select) {
  for (var i = 0; i < availStocks.length; i++) {
    var option = document.createElement("option");
    if (i == 0) {
      option.selected = true;
    }
    option.value = availStocks[i];
    option.innerHTML = stockNames[i];
    select.appendChild(option);
  }
}

//////////////// Message Listerner
var ordersGrid = null;
var prgs = 0;
var odersDisplay = false;

function fillOrdersTable(prog, status) {
  // Updating a orders grid row with status as the result of sendmessage.
  ordersGrid.updateRow(prog,{status:status});
}


function changeOrdersDisplay() {
	var orders = document.getElementById("needforscroll");
	
	if ( odersDisplay == false ) {
		orders.style.display = "";
		document.getElementById("gridOpt").value = "Hide my orders ";
		document.getElementById("gridOpt").style.background = "#fff url('images/minus.gif') no-repeat center right";
		odersDisplay = true;
	} else {
		document.getElementById("gridOpt").value = "Show my orders ";
		document.getElementById("gridOpt").style.background = "#fff url('images/plus.gif') no-repeat center right";
		orders.style.display = "none";
		odersDisplay = false;
	}
}

//////////////// Order Submission Management

function submitForm(op) {
  var name = document.getElementById("stockN");
  var qtyN = document.getElementById("qtyN");
  var pxN = document.getElementById("pxN");

  if (!window.client || !op || !name || !qtyN) {
    //this shouldn't happen
    return;
  }

  var qty = qtyN.value;
  var px = pxN.value;
  var stockName = name.value;

  if (!qty || !stockName) {
    alert("No empty fields admitted. Please fill the 'quantity' field and choose a stock.");
  } else {
    var wrong = false;

    if (isNaN(qty)) {
      alert("Only digits are admitted for the 'quantity' field. Please re-type the value.");
      return;
    }
	 
	 if (isNaN(px)) {
      alert("Only digits are admitted for the 'price' field. Please re-type the value.");
      return;
    }
	 
	 if ( (qty < 1) || (qty > 1000000) ) {
      alert("Price out of range [1 - 1000000]. Please re-type the value.");
      return;
    }
	 
	 if ( (px < 0.1) || (px > 1000) ) {
      alert("Price out of range [0 - 1000]. Please re-type the value.");
      return;
    }
	 
    // Adding a row to orders grid with sending order data.
    var prog = ++prgs;
    ordersGrid.updateRow(prog,{side:op,prog:prog,qty:qty,px:px,stock:stockName,status:"SUBMITTING"});

    var mex = op + "|" + stockName + "|" + qty + "|" + px;
    client.sendMessage(mex, "Orders", 30000, {
      onAbort: function(originalMex, snt) {
        fillOrdersTable(prog, "ABORT");
      },
      onDeny: function(originalMex, code, message) {
        if ( code >= 0 ) {
          fillOrdersTable(prog, "DENY");
        } else {
          fillOrdersTable(prog, message);
        }
      },
      onDiscarded: function(originalMex) {
        fillOrdersTable(prog, "DISCARDED");
      },
      onError: function(originalMex) {
        fillOrdersTable(prog, "ERROR");
      },
      onProcessed: function(originalMex) {
        fillOrdersTable(prog, "PROCESSED");
      }
    });
   }
}

//////////////// Grid Sort Management

var initialOrdersSort = "prog";
var ordersDirection = true; // true = decreasing; false = increasing; null = no sort

function changeSortOrders(sortOn) {
  var sortedBy = ordersGrid.getSortField();
  if (sortOn == sortedBy) {
    if (ordersDirection == true) {
      ordersDirection = false;
      document.getElementById("img_ord_" + sortOn).src = "images/up.gif";
    } else if (ordersDirection == false) {
      ordersDirection = null;
      document.getElementById("img_ord_" + sortOn).src = "images/spacer.gif";
      document.getElementById("col_ord_" + sortOn).className = "tableTitle";
    } else {
      ordersDirection = true;
      document.getElementById("img_ord_" + sortOn).src = "images/up.gif";
    }
  } else {
    ordersDirection = true;
    if (sortedBy != null) {
      document.getElementById("img_ord_" + sortedBy).src = "images/spacer.gif";
      document.getElementById("col_ord_" + sortedBy).className = "tableTitle";
    }
    document.getElementById("img_ord_" + sortOn).src = "images/down.gif";
    document.getElementById("col_ord_" + sortOn).className = "tableTitleSorted";
  }

  if (ordersDirection == null) {
    ordersGrid.setSort(null);
  } else {
    if (sortOn == "qty" || sortOn == "prog" || sortOn == "px") {
      ordersGrid.setSort(sortOn, ordersDirection, true, false);
    } else {
      ordersGrid.setSort(sortOn, ordersDirection);
    }
  }
}

// Orders grid pagination disable.
/*
var currentPage = 1;

function changePage(direction) {
  console.log("goto page: " + direction);
  
  if ( direction == 0 && currentPage > 1) {
    ordersGrid.goToPage(--currentPage);
  }
  
  if ( direction == 1 && currentPage < ordersGrid.getCurrentPages()) {
    ordersGrid.goToPage(++currentPage);
  }
  
  document.getElementById("pageNumber").innerHTML = " Page: " + currentPage + "/" + ordersGrid.getCurrentPages() + " ";
}*/


var client = null;
require(["js/lsClient","DynaGrid"],function(lsClient,DynaGrid) {
  //save references to the LightstreamerClient to be used to 
  //send messages
  client = lsClient;

  //enable/disable form based on the status of the connection
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
  
  // orders grid
  dynaGrid = new DynaGrid("orders",true);
  
  // Orders grid pagination disable.
  // dynaGrid.setMaxDynaRows(15);
  
  dynaGrid.setAutoCleanBehavior(true, false);
  dynaGrid.addListener({
    onVisualUpdate: function(key,info) {
      if (info == null) {
        return;
      }
      // visual effects on updates
      info.setHotTime(hotOrdersTime);
      if (doOrdersFade) {
        info.setHotToColdTime(fadeOrdersTime);
      }  
      
      info.setCellStyle("qty", "lshotq", "lscoldq");
		info.setCellStyle("px", "lshotq", "lscoldq");
      info.setCellStyle("prog", "lshotln", "lscoldln");
      info.setCellStyle("stock", "lshotl", "lscoldl");
      info.setCellStyle("status", "lshotln", "lscoldln");
      info.setCellStyle("side", "lshotc", "lscoldc")
    }    
    
  });
  ordersGrid = dynaGrid;
    
   // let's define the initial sorting column for orders grid
  changeSortOrders(initialOrdersSort);
});
