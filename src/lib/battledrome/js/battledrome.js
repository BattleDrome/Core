BD = {
    accountSelector: $('#account-picker > select'),
    dataRefreshTimer: 0,
    currentEvent: null,
    combatLogEvents: [],
    minDelay: 1000,
    maxDelay: 3000,

    init: function () {
        //Main App Init Here
        BDLib.init();
        BD.initPassiveUI();
        BD.waitForBDLib();
    },

    waitForBDLib: function () {
        if (BDLib.accountReady && BDLib.ready) {
            BD.initUI();
        } else {
            window.setTimeout(BD.waitForBDLib, 500);
        }
    },

    initPassiveUI: async () => {
        BD.flushUI();
        BD.renderPageTemplates();
        BD.loadDialogs();
        await RenderWarrior.precache();
    },

    initUI: function () {
        BD.refreshTimer();
        BD.forceRefresh();
        BD.timedCombatLogQueue();
    },

    detectedAccountChange: function () {
        BD.showNotify("Detected Account Switch!", "", "warning", 5000);
        BD.initPassiveUI();
        BD.initUI();
    },

    flushUI: function () {
        BD.showNotify("Loading UI...", "", "info", 5000);
        $('#dashboard_container').empty();
        $('#warriors_container').empty();
        $('#events_container').empty();
        $('#academy_container').empty();
        $('#docs_container').empty();
    },

    renderPageTemplates: function () {
        console.log("Rendering Page Templates...")
        $('#dashboard_container').load("templates/dashboard_page_header.html");
        $('#warriors_container').load("templates/warriors_page_header.html");
        $('#events_container').load("templates/events_page_header.html");
        $('#marketplace_container').load("templates/marketplace_page_header.html");
        $('#academy_container').load("templates/academy_page_header.html");
        $('#docs_container').load("templates/docs_page_header.html");
    },

    forceRefresh: function () {
        BD.dataRefreshTimer = 3;
    },

    refreshTimer: function () {
        window.setTimeout(BD.refreshTimer, 1000);
        BD.dataRefreshTimer--;
        if (BD.dataRefreshTimer <= 0) {
            BD.refreshUIData();
            BD.dataRefreshTimer = 30;
        }
    },

    refreshUIData: function () {
        var notify = BD.showNotify("Refreshing Data...", "", "info", 0);
        BD.refreshWarriors();
        BD.refreshEvents();
        //BD.refreshMarketplace();
        //BD.refreshAcademy();
        window.setTimeout(BD.updateAddCards, 500);
        notify.close();
    },

    updateAddCards: function () {
        //Warrior Add Card
        if($("#warrior_create_card")!=undefined){
            $("#warrior_create_card").remove();
        }
        $("#warriors_container").append("<div id='warrior_create_card'></div>");
        $("#warrior_create_card").load("templates/warrior_create_card.html");
        //Event Add Card
        if($("#event_create_card")!=undefined){
            $("#event_create_card").remove();
        }
        $("#events_container").append("<div id='event_create_card'></div>");
        $("#event_create_card").load("templates/event_create_card.html");
    },

    loadDialog: function (dialogName) {
        console.log("Loading Dialog: " + dialogName);
        $('.app-outer-container').append('<div class="dialog_wrapper" id="' + dialogName + '_wrapper"></div>');
        $('#' + dialogName + '_wrapper').load("templates/" + dialogName + ".html");
    },

    loadDialogs: function () {
        console.log("Loading Dialog Templates...");
        BD.loadDialog("warrior_create_dialog");
        BD.loadDialog("warrior_teach_dialog");
        BD.loadDialog("warrior_sell_dialog");
        BD.loadDialog("warrior_pay_dialog");
        BD.loadDialog("warrior_name_dialog");
        BD.loadDialog("event_create_dialog");
        BD.loadDialog("event_join_dialog");
        BD.loadDialog("event_spectator_dialog");
        BD.loadDialog("academy_trainwith_dialog");
    },

    flipCard: function (cardDivID) {
        $('#' + cardDivID + " .card").toggleClass('flipped');
    },

    updateColorPicker: function() {
        var hue = $('#cw_color').val();
        var saturation = 40;
        var value = 30;
        var hsvText = "hsl("+hue+","+saturation+"%,"+value+"%)";
        $("#color-example").css({"background": hsvText });
    },

    showNotify: function (title, text, notifyType, autoCloseDelay) {
        var notifyData = {
            title: title,
            message: text,
            icon: 'glyphicon glyphicon-warning-sign'
        };
        var notifySettings = {
            element: 'body',
            position: null,
            type: notifyType,
            allow_dismiss: true,
            newest_on_top: true,
            z_index: 1031,
            delay: autoCloseDelay,
            mouse_over: 'pause',
        };
        return $.notify(notifyData, notifySettings);
    },

    showCreateNotify: function (name) {
        return BD.showNotify("Create: " + name, "Transaction Pending...", "info", 0);
    },

    showAccountPendingNotify: function () {
        return BD.showNotify("Blockchain", "Account Unlock Pending...", "warning", 0);
    },

    showCreateEventNotify: function () {
        return BD.showNotify("Create Event", "Transaction Pending...", "info", 0);
    },

    showPurchaseNotify: function () {
        return BD.showNotify("Warrior Purchase", "Transaction Pending...", "info", 0);
    },

    showJoinEventNotify: function () {
        return BD.showNotify("Event Join", "Transaction Pending...", "info", 0);
    },

    showStartEventNotify: function () {
        return BD.showNotify("Event Start", "Transaction Pending...", "info", 0);
    },

    showCancelNotifyEvent: function () {
        return BD.showNotify("Event Cancellation", "Transaction Pending...", "info", 0);
    },

    showWarriorNotify: function (name,action) {
        return BD.showNotify("Warrior "+name+" "+action, "Transaction Pending...", "info", 0);
    },

    notifySucceed: function (notify) {
        notify.update('message', 'Success!');
        notify.update('type', 'success');
        window.setTimeout(notify.close, 3000);
    },

    notifyFail: function (notify, error) {
        notify.update('message', '<B>Failed!</B><BR>' + error);
        notify.update('type', 'danger');
        window.setTimeout(notify.close, 10000);
    },

    renderComponent: function (containerID, templateName, elementID, dataSet, extraCallback) {
        var div_id = containerID + "_" + templateName + "_" + elementID;
        if ($('#' + div_id).html() == undefined) {
            $('#' + containerID).append('<div class="' + templateName + '" id="' + div_id + '"></div>')
            $('#' + div_id).load("templates/" + templateName + ".html", function () {
                var templateHTML = $('#' + div_id).html();
                var newHTML = templateHTML
                    .replace(new RegExp('{{ELEMENTID}}', 'g'), elementID)
                    .replace(new RegExp('{{DIVID}}', 'g'), div_id);
                $('#' + div_id).html(newHTML);
                BD.refreshComponentData(div_id, dataSet, extraCallback);                
            });
        } else {
            BD.refreshComponentData(div_id, dataSet, extraCallback);
        }
        return $('#' + div_id);
    },

    refreshComponentData: function (div_id, dataSet, extraCallback) {
        if (dataSet != null && dataSet != undefined) {
            Object.keys(dataSet).forEach(function (key, index) {
                $('#' + div_id + ' #data_' + key).text(dataSet[key]);
                $('#' + div_id + ' #progressbar_' + key).width(dataSet[key]);
                $('#' + div_id + ' #status_' + key).attr('class', "badge badge-" + dataSet[key]);
            });
            if(extraCallback!=undefined) extraCallback(div_id, dataSet);
        }
    },

    renderWarriorImage: async (div_id, warrior) => {
        RenderWarrior.render("warrior-image-"+warrior.id,warrior);
    },

    renderMarketImage: async (div_id, warrior) => {
        RenderWarrior.render("market-image-"+warrior.id,warrior);
    },

    renderTrainerImage: async (div_id, warrior) => {
        RenderWarrior.render("trainer-image-"+warrior.id,warrior);
    },

    refreshWarriors: async () => {
        var warriors = await BDLib.getWarriorList();
        $.each(warriors, function (index, warrior) {
            BD.renderComponent("warriors_container", "warrior_card", warrior['id'], warrior, BD.renderWarriorImage);
        });
    },

    refreshEvents: async () => {
        var events = await BDLib.getEventList();
        $.each(events, function (index, event) {
            BD.renderComponent("events_container", "event_card", event['id'], event);
            BD.updateEventButtons(event['id'], event);
        });
    },

    refreshMarketplace: async () => {
        $('#marketplace_container').empty();
        $('#marketplace_container').load("templates/marketplace_page_header.html");
        var warriors = await BDLib.getMarketList();
        $.each(warriors, function (index, warrior) {
            BD.renderComponent("marketplace_container", "marketplace_card", warrior['id'], warrior, BD.renderMarketImage);
        });
    },

    refreshAcademy: async () => {
        $('#academy_container').empty();
        $('#academy_container').load("templates/academy_page_header.html");
        var warriors = await BDLib.getAcademyList();
        $.each(warriors, function (index, warrior) {
            BD.renderComponent("academy_container", "academy_card", warrior['id'], warrior, BD.renderTrainerImage);
        });
    },

    updateEventButtons: function (index, event) {
        if (event['owner'] != BDLib.getAccount()) {
            $("#cancelbutton-" + event['id']).hide();
        }
    },

    createWarrior: function () {
        $("#modalCreateWarrior").modal();
    },

    doCreateWarrior: function () {
        var warriorName = $('#cw_name').val();
        var colorHue = $('#cw_color').val();
        var weaponType = $('#cw_weaponType').val();
        var armorType = $('#cw_armorType').val();
        var shieldType = $('#cw_shieldType').val();
        BDLib.createWarrior(colorHue, armorType, shieldType, weaponType);
    },

    createEvent: function () {
        $("#modalCreateEvent").modal();
    },

    doCreateEvent: function () {
        var warriorMin = $('#ce_warriormin').val();
        var warriorMax = $('#ce_warriormax').val();
        var minLevel = $('#ce_minlevel').val();
        var maxLevel = $('#ce_maxlevel').val();
        var minEquipLevel = $('#ce_minequiplevel').val();
        var maxEquipLevel = $('#ce_maxequiplevel').val();
        var maxPolls = $('#ce_maxpolls').val();
        var joinFee = $('#ce_joinfee').val();
        if(BDLib.canCreateEvent(warriorMax)){
            BDLib.createEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFee);
        }else{
            console.log("Could Not Create Event");
            BD.showNotify("Event Creation Error", "You are not currently able to create an event! You may not be able to afford it, your parameters may be incorrect, or you may already have an active (unfinished) event!", "danger", 5000);
        }
    },

    nameWarrior: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            $("#modalWarriorName").modal();
            $("#wn_id").val(warriorId);
        }else{
            BD.showNotify("Name Error", "The Warrior is Busy, can't currently be Named!", "danger", 5000);
        }        
    },

    doNameWarrior: async () => {
        var warriorId = $("#wn_id").val();
        var name = $("#wn_name").val();
        BDLib.setWarriorName(warriorId,name);
    },

    payWarrior: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            $("#modalWarriorPay").modal();
            $("#wp_id").val(warriorId);
        }else{
            BD.showNotify("Pay Error", "The Warrior is Busy, can't currently be Payed!", "danger", 5000);
        }        
    },

    doPayWarrior: async () => {
        var warriorId = $("#wp_id").val();
        var amount = parseFloat($("#wp_amount").val());
        BDLib.payWarrior(warriorId,amount);
    },

    buyStat: function (warriorIndex, stat) {
        var buyVal = $("#buy_" + stat + "_" + warriorIndex).text();
        var newVal = parseInt(buyVal) + 1;
        $("#buy_" + stat + "_" + warriorIndex).text(newVal);
    },

    unbuyStat: function (warriorIndex, stat) {
        var buyVal = $("#buy_" + stat + "_" + warriorIndex).text();
        var newVal = parseInt(buyVal) - 1;
        if (newVal <= 0) newVal = 0;
        $("#buy_" + stat + "_" + warriorIndex).text(newVal);
    },

    resetStats: function (warriorIndex) {
        $("#buy_str_" + warriorIndex).text(0);
        $("#buy_con_" + warriorIndex).text(0);
        $("#buy_dex_" + warriorIndex).text(0);
        $("#buy_luck_" + warriorIndex).text(0);
    },

    purchaseStats: async (warriorIndex) => {
        var strBuyVal = parseInt($("#buy_str_" + warriorIndex).text());
        var conBuyVal = parseInt($("#buy_con_" + warriorIndex).text());
        var dexBuyVal = parseInt($("#buy_dex_" + warriorIndex).text());
        var luckBuyVal = parseInt($("#buy_luck_" + warriorIndex).text());
        var pointCost = await BDLib.getStatCost(warriorIndex, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal);
        var pointBalance = $('#warriors_container_warrior_card_' + warriorIndex + ' #data_points').text();
        console.log("Purchase Cost:" + pointCost + " Balance:" + pointBalance);
        if (parseInt(pointBalance) >= parseInt(pointCost)) {
            if(strBuyVal>0 || conBuyVal>0 || dexBuyVal>0 || luckBuyVal>0){
                BD.resetStats(warriorIndex);
                BDLib.purchaseStats(warriorIndex, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal);
            }else{
                BD.showNotify("Purchase Error", "You haven't specified any attributes to purchase! This would waste gas!", "danger", 5000);
            }
        } else {
            BD.showNotify("Purchase Error", "The warrior doesn't have enough points for this attribute purchase!", "danger", 5000);
        }
    },

    buyEquip: function (warriorIndex, equip) {
        var buyVal = $("#buy_" + equip + "_" + warriorIndex).text();
        var newVal = parseInt(buyVal) + 1;
        $("#buy_" + equip + "_" + warriorIndex).text(newVal);
    },

    unbuyEquip: function (warriorIndex, equip) {
        var buyVal = $("#buy_" + equip + "_" + warriorIndex).text();
        var newVal = parseInt(buyVal) - 1;
        if (newVal <= 0) newVal = 0;
        $("#buy_" + equip + "_" + warriorIndex).text(newVal);
    },

    resetEquip: function (warriorIndex) {
        $("#buy_weapon_" + warriorIndex).text(0);
        $("#buy_armor_" + warriorIndex).text(0);
        $("#buy_shield_" + warriorIndex).text(0);
        $("#buy_potions_" + warriorIndex).text(0);
        $("#buy_intpotions_" + warriorIndex).text(0);
    },

    purchaseEquip: async (warriorIndex) => {
        var weaponBuyVal = parseInt($("#buy_weapon_" + warriorIndex).text());
        var armorBuyVal = parseInt($("#buy_armor_" + warriorIndex).text());
        var shieldBuyVal = parseInt($("#buy_shield_" + warriorIndex).text());
        var potionsBuyVal = parseInt($("#buy_potions_" + warriorIndex).text());
        var intpotionsBuyVal = parseInt($("#buy_intpotions_" + warriorIndex).text());
        var ethCost = await BDLib.getEquipCost(warriorIndex, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal);
        console.log("Purchase Cost:" + ethCost);
        BD.resetEquip(warriorIndex);
        BDLib.purchaseEquip(warriorIndex, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal);
    },

    joinEvent: async (eventIndex) => {
        $("#modalJoinEvent").modal();
        $("#join_warrior_selector").empty();
        var warriors = await BDLib.getWarriorList();
        $.each(warriors, function (index, warrior) {
            $("#join_warrior_selector").append('<button id="dojoinbutton-' + warrior['id'] + '" class="btn btn-' + warrior['statetypestring'] + ' action-button" onClick="BD.doJoinEvent(' + eventIndex + ',' + warrior['id'] + ');">' + warrior['name'] + '</button>');
        });
    },

    doJoinEvent: async (eventIndex, warriorIndex) => {
        $("#modalJoinEvent").modal('toggle');
        if (await BDLib.canJoinEvent(eventIndex, warriorIndex)) {
            console.log("Joined Event:" + eventIndex + " With Warrior:" + warriorIndex);
            await BDLib.joinEvent(eventIndex, warriorIndex);
        } else {
            console.log("Could Not Join Event:" + eventIndex + " With Warrior:" + warriorIndex);
            BD.showNotify("Join Error", "That Warrior can not join this Event!<br>Please double-check the event requirements and warrior statistics!", "danger", 5000);
        }
    },

    startEvent: async (eventIndex) => {
        if (await BDLib.canStartEvent(eventIndex)) {
            console.log("Started Event:" + eventIndex);
            await BDLib.startEvent(eventIndex);
        } else {
            console.log("Could Not Start Event:" + eventIndex);
            BD.showNotify("Start Error", "That Event can not currently Start!<br>Please double-check the event requirements!", "danger", 5000);
        }
    },

    cancelEvent: async (eventIndex) => {
        if (await BDLib.canCancelEvent(eventIndex)) {
            console.log("Cancelled Event:" + eventIndex);
            await BDLib.cancelEvent(eventIndex);
        } else {
            console.log("Could Not Cancel Event:" + eventIndex);
            BD.showNotify("Cancel Error", "That Event can not currently be Cancelled!", "danger", 5000);
        }
    },

    watchEvent: function (eventIndex) {
        $("#modalSpectateEvent").modal();
        BD.currentEvent = eventIndex;
        $("#event_combatlog").empty();
    },

    eventCombatLogItem: function (text, type) {
        $("#event_combatlog").append('<div class="alert alert-' + type + '" role="alert">' + text + '</div>');
        $('#event_combatlog').scrollTop($('#event_combatlog')[0].scrollHeight);
    },

    queueCombatLogEvent: function (logString, logType, index) {
        console.log("Queueing Log:" + logString + " at Index: " + index);
        BD.combatLogEvents.push({ string: logString, type: logType, idx: index });
        BD.combatLogEvents.sort(function(a,b){
            return a.index-b.index;
        });
        //TODO: Fix sorting?!?!?!?
    },

    deQueueCombatLogEvent: function () {
        if (BD.combatLogEvents.length > 0) {
            var event = BD.combatLogEvents.shift();
            console.log(event);
            BD.eventCombatLogItem(event.string, event.type);
        }
    },

    timedCombatLogQueue: function () {
        var delay = Math.floor((Math.random() * (BD.maxDelay - BD.minDelay)) + BD.minDelay);
        BD.deQueueCombatLogEvent();
        window.setTimeout(BD.timedCombatLogQueue, delay);
    },

    handleCombatLogEvent: async (error, event) => {
        console.log(event);
        if (BD.currentEvent != null) {
            if (event.args.event_id == BD.currentEvent) {
                switch (event.event) {
                    case "WarriorDefeated":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var logString = warriorName + "(#" + warrior + ") Was Defeated By " + attackerName + "(#" + attacker + ")";
                        var logType = "danger";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorEngaged":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warriorA = event.args.warriorA;
                        var warriorB = event.args.warriorB;
                        var aName = await BDLib.getWarriorName(warriorA);
                        var bName = await BDLib.getWarriorName(warriorB);
                        var logString = aName + "(#" + warriorA + ") Has Engaged " + bName + "(#" + warriorB + ")";
                        var logType = "info";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorEscaped":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var logString = warriorName + "(#" + warrior + ") Has Escaped From Combat With " + attackerName + "(#" + attacker + ")";
                        var logType = "success";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorDrankPotion":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var logString = warriorName + "(#" + warrior + ") Was Nearly Defeated By " + attackerName + "(#" + attacker + ") But They Survived!";
                        var logType = "success";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorHit":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var damageDealt = event.args.damageDealt;
                        if (damageDealt > 0) {
                            var logString = attackerName + "(#" + attacker + ") Hit : " + warriorName + "(#" + warrior + ") for " + damageDealt + " Damage!";
                        } else {
                            var logString = attackerName + "(#" + attacker + ") Hit : " + warriorName + "(#" + warrior + ") But They Withstood It!";
                        }
                        var logType = "warning";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorDodged":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var logString = warriorName + "(#" + warrior + ") Dodged An Attack From " + attackerName + "(#" + attacker + ")";
                        var logType = "success";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "WarriorBlocked":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var attacker = event.args.attacker;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var attackerName = await BDLib.getWarriorName(attacker);
                        var damageBlocked = event.args.damageBlocked;
                        var logString = warriorName + "(#" + warrior + ") Blocked " + damageBlocked + " Damage From " + attackerName + "(#" + attacker + ")!";
                        var logType = "success";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "EventFinished":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var logString = "Event Has Finished!";
                        var logType = "info";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                    case "EventWinner":
                        var timestamp = event.args.timeStamp;
                        var index = event.logIndex;
                        var warrior = event.args.warrior;
                        var warriorName = await BDLib.getWarriorName(warrior);
                        var logString = warriorName + "(#" + warrior + ") Has Been Declared The Winner!";
                        var logType = "info";
                        BD.queueCombatLogEvent(logString, logType, index);
                        break;
                }
            }
        }
    },

    pollCurrentEvent: async () => {
        var eventId = BD.currentEvent;
        if((await BDLib.getEventState(eventId))==1){
            if(await BDLib.canPollEvent(eventId)){
                BDLib.pollEvent(eventId);
            }else{
                console.log("Could Not Poll Event");
                alert("You are not currently able to poll this event!\r\nYou are likely the most recent poller, meaning you have to wait to let someone else have a turn, then you can poll again!");
            }            
        }else{
            alert("The Event is not Active, can't be Polled!");
        }
    },

    warriorTrainingDone: async (warriorId) => {
        var trainingEnds = await BDLib.getTrainingEnds(warriorId);
        var currentTime = Math.floor(Date.now() / 1000);
        return currentTime > trainingEnds;
    },

    warriorTrainingMinutesLeft: async (warriorId) => {
        var trainingEnds = await BDLib.getTrainingEnds(warriorId);
        var currentTime = Math.floor(Date.now() / 1000);
        return Math.ceil((trainingEnds-currentTime)/60);
    },

    warriorTogglePractice: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==1){ //Practicing State
            await BD.warriorStopPracticing(warriorId);
        }else{
            await BD.warriorPractice(warriorId);
        }
    },

    warriorPractice: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            BDLib.warriorPractice(warriorId);
        }else{
            BD.showNotify("Practice Error", "Warrior Is Busy! Can't currently Practice!", "danger", 5000);
        }
    },

    warriorStopPracticing: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==1){
            if(BD.warriorTrainingDone(warriorId)){
                BDLib.warriorStopPracticing(warriorId);
            }else{
                var minsLeft = BD.warriorTrainingMinutesLeft(warriorId);
                BD.showNotify("Practice Error", "The warrior hasn't completed the current training cycle yet!<br>Please wait approximately "+minsLeft+" Minutes!", "danger", 5000);
            }
        }else{
            BD.showNotify("Practice Error", "The Warrior isn't currently Practicing!", "danger", 5000);
        }
    },

    warriorStopTraining: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==2){
            if(BD.warriorTrainingDone(warriorId)){
                BDLib.warriorStopTraining(warriorId);
            }else{
                var minsLeft = BD.warriorTrainingMinutesLeft(warriorId);
                BD.showNotify("Training Error", "The warrior hasn't completed the current training cycle yet!<br>Please wait approximately "+minsLeft+" Minutes!", "danger", 5000);
            }
        }else{
            BD.showNotify("Training Error", "The Warrior isn't currently Training!", "danger", 5000);
        }
    },

    warriorToggleTeaching: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==3){ //Teaching State
            await BD.warriorStopTeaching(warriorId);
        }else{
            await BD.warriorStartTeaching(warriorId);
        }
    },

    warriorStartTeaching: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            $("#modalWarriorTeach").modal();
            $("#wt_id").val(warriorId);
        }else{
            BD.showNotify("Teaching Error", "The Warrior is Busy, can't currently Teach!", "danger", 5000);
        }        
    },

    doWarriorStartTeaching: async () => {
        var warriorId = $("#wt_id").val();
        var teachingFee = $("#wt_fee").val();
        //TODO: Get fee from user input
        BDLib.warriorStartTeaching(warriorId,teachingFee);
    },

    warriorStopTeaching: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==3){
            if(BD.warriorTrainingDone(warriorId)){
                BDLib.warriorStopTeaching(warriorId);
            }else{
                var minsLeft = BD.warriorTrainingMinutesLeft(warriorId);
                BD.showNotify("Teaching Error", "The warrior hasn't completed the current training cycle yet!<br>Please wait approximately "+minsLeft+" Minutes!", "danger", 5000);
            }
        }else{
            BD.showNotify("Teaching Error", "The Warrior isn't currently Teaching!", "danger", 5000);
        }
    },

    warriorTrainWith: async (trainerId) => {
        $("#modalTrainWith").modal();
        $("#trainwith_warrior_selector").empty();
        var warriors = await BDLib.getWarriorList();
        $.each(warriors, function (index, warrior) {
            $("#trainwith_warrior_selector").append('<button id="dotrainwithbutton-' + warrior['id'] + '" class="btn btn-' + warrior['statetypestring'] + ' action-button" onClick="BD.doWarriorTrainWith(' + trainerId + ',' + warrior['id'] + ');">' + warrior['name'] + '</button>');
        });
    },

    doWarriorTrainWith: async (trainerId,warriorId) => {
        $("#modalTrainWith").modal('toggle');
        if (await BDLib.canTrainWith(warriorId, trainerId)) {
            console.log("Warrior:" + warriorId + " Training With Trainer:" + trainerId);
            await BDLib.warriorTrainWith(warriorId, trainerId);
        } else {
            console.log("Warrior:" + warriorId + " Could Not Train With:" + trainerId);
            BD.showNotify("Training Error", "That Warrior can not train with this trainer!<br>This may be because the trainer is not higher level,<br>or the trainers primary stat is not higher than this warrior's primary stat,<br>or the warrior can not afford the fee!", "danger", 5000);
        }
    },

    warriorRevive: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==6){
            BDLib.warriorRevive(warriorId);
        }else{
            BD.showNotify("Revive Error", "The Warrior doesn't currently require Reviving!", "danger", 5000);
        }
    },

    warriorDrinkPotion: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            if((await BDLib.getWarriorPotions(warriorId))>0){
                if((await BDLib.getWarriorDmg(warriorId))>0){
                    BDLib.warriorDrinkPotion(warriorId);
                }else{
                    BD.showNotify("Potion Error", "The Warrior is currently undamaged, no need for a potion!", "danger", 5000);
                }
            }else{
                BD.showNotify("Potion Error", "The Warrior currently doesn't have any potions!", "danger", 5000);
            }
        }else{
            BD.showNotify("Potion Error", "The Warrior is Busy, can't currently drink potions!", "danger", 5000);
        }
    },

    warriorRetire: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0 || (await BDLib.getWarriorState(warriorId))==6){
            BDLib.warriorRetire(warriorId);
        }else{
            BD.showNotify("Retire Error", "The Warrior is Busy, can't currently Retire!", "danger", 5000);
        }
    },

    warriorToggleSale: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==8){ //ForSale State
            await BD.warriorEndSale(warriorId);
        }else{
            await BD.warriorStartSale(warriorId);
        }
    },

    warriorStartSale: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==0){
            $("#modalWarriorSell").modal();
            $("#ws_id").val(warriorId);
        }else{
            BD.showNotify("Sale Error", "The Warrior is Busy, can't currently Be Sold!", "danger", 5000);
        }        
    },

    doWarriorStartSale: async () => {
        var warriorId = $("#ws_id").val();
        var price = $("#ws_fee").val();
        BDLib.warriorStartSale(warriorId,price);
    },
    
    warriorEndSale: async (warriorId) => {
        if((await BDLib.getWarriorState(warriorId))==8){
            BDLib.warriorEndSale(warriorId);
        }else{
            BD.showNotify("Sale Error", "The Warrior is not currently being sold! Nothing to stop!", "danger", 5000);
        }
    },

    warriorPurchase: async (warriorId) => {
        console.log("warriorPurchase: "+warriorId);
        await BDLib.warriorPurchase(warriorId);
    },

};

BD.init();