// This file contains:
//		PVizModel abstract Class
//		PViewFrame Object
//		PDataHub Module for handling data
//		PBootstrap for launching processes and organizing screen


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
	if (this == null) {
	  throw new TypeError('Array.prototype.find called on null or undefined');
	}
	if (typeof predicate !== 'function') {
	  throw new TypeError('predicate must be a function');
	}
	var list = Object(this);
	var length = list.length >>> 0;
	var thisArg = arguments[1];
	var value;

	for (var i = 0; i < length; i++) {
	  value = list[i];
	  if (predicate.call(thisArg, value, i, list)) {
		return i;
	  }
	}
	return -1;
  };
}

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, w, p }

	// GLOBAL CONSTANTS
var EVENT_INSTANT = 1;			// Single instantaneous event (not Date range)
var EVENT_F_START = 2;			// Event has fuzzy start
var EVENT_F_END = 4;			// Event has fuzzy end

var PSTATE_INIT = 0;			// Internal initialization
var PSTATE_REQ = 1;				// Waiting for requested data
var PSTATE_PROCESS = 2;			// Processing data or handling command
var PSTATE_BUILD = 3;			// Building visuals
var PSTATE_READY = 4;			// Waiting for user

// ========================================================================
// PVizModel: An abstract class to be subclassed by specific visualizations

	// INPUT: 	viewFrame = instance variable returned from ViewModel pseudo-constructor
	//			frameID = base ID for frame DIV
	//			vizSettings = c section of VF entry
function PVizModel(viewFrame, vizSettings)
{
	this.vFrame   = viewFrame;
	this.frameID  = viewFrame.getFrameID()+' .viz-content .viz-result';
	this.settings = vizSettings;

		// All subclasses must implement the following:
	// this.usesLegend()
	// this.getLocAtts(tIndex)
	// this.getFeatureAtts(tIndex)
	// this.setup()
	// this.render(IndexStream)
	// this.setSelection(ids)
	// this.clearSelection()
	// this.getPerspective()
	// this.setPerspective(pData)
	// this.teardown()
} // PVizModel


PVizModel.prototype.getLocAtts = function(tIndex)
{
	return [];
} // PVizModel.getLocAtts

PVizModel.prototype.getFeatureAtts = function(tIndex)
{
	return [];
} // PVizModel.getFeatureAtts

PVizModel.prototype.teardown = function()
{
} // PVizModel.teardown


// ===================================
// VizMap: Class to visualize GIS maps


var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
		// Determine which 
} // ViewMap

VizMap.prototype = Object.create(PVizModel.prototype);

VizMap.prototype.constructor = VizMap;

VizMap.prototype.usesLegend = function()
{
	return true;
} // usesLegend()

	// PURPOSE: Return IDs of locate Attributes 
VizMap.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.cAtts[tIndex];
	return this.settings.cAtts;
} // getLocAtts()

VizMap.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizMap.prototype.setup = function()
{
		// Create instance of Leaflet
	var centerLat = parseFloat(this.settings.clat);
	var centerLon = parseFloat(this.settings.clon);
	var zoom;
	if (typeof(this.settings.zoom) == 'string')
		parseInt(this.settings.zoom);
	else
		zoom = this.settings.zoom;
	var vIndex = this.vFrame.getIndex();

		// Leaflet requires a DIV ID to startup: create and insert one
	jQuery(this.frameID).append('<div id="l-map-'+vIndex+'" class="max-size"></div>');

	this.lMap = L.map("l-map-"+vIndex, { zoomControl: false }).setView([centerLat, centerLon], zoom);

		// Add an OpenStreetMap base layer
	L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
		subdomains: '1234',
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(this.lMap);

		// Create controls in top-right
	var layerControl = L.control.zoom({position: 'topright'});
	layerControl.addTo(this.lMap);

	var markers;
	if (this.settings.clster) {
		markers = new L.MarkerClusterGroup();
	} else {
		markers = L.featureGroup();            
	}
	this.markerLayer = markers;

		// Create options properties if they don't already exist
	markers.options = markers.options || { };
	markers.options.layerName = 'TO DO';

	markers.addTo(this.lMap);

		// Maintain number of Loc Atts per Template type
	var numT = PDataHub.getNumETmplts();
	this.tLCnt = new Uint16Array(numT);
	for (var i=0; i<numT; i++)
		this.tLCnt[i] = 0;
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizMap.prototype.render = function(datastream)
{
	var self = this;
	var mLayer = this.markerLayer;

		// PURPOSE: Handle click on feature
		// NOTES: 	_aid is absolute index of record, but there can be multiple instances of same record!
		//			This function being within render closure makes it inefficient,
		//				but need access to vFrame!
	function markerClick(e)
	{
		if (e.target && e.target.options) {
			var aid = e.target.options._aid;
			var added = self.vFrame.toggleSel(aid);
// console.log("Added "+e.target.options._aid+"? "+added);

				// Which Template type does absolute index belong to? Does it have multiple location Attributes?
			var tI = PDataHub.aIndex2Tmplt(aid);
				// If so, go through all markers looking for fellows of same _aid and setStyle accordingly
			if (self.tLCnt[tI] > 1) {
				mLayer.eachLayer(function(marker) {
					if (marker.options._aid == aid) {
						if (added)
							marker.setStyle({ color: "#ff0000" });
						else
							marker.setStyle({ color: "#000" });
					}
				});
			} else {
				if (added)
					this.setStyle({ color: "#ff0000" });
				else
					this.setStyle({ color: "#000" });
			}
		}
	} // markerClick()


		// Remove previous Markers
	mLayer.clearLayers();

	var rad;

	switch (self.settings.size) {
	case 's': rad=3; break;
	case 'm': rad=7; break;
	case 'l': rad=12; break;
	}

	var numTmplts = PDataHub.getNumETmplts();
	var i=0, aI, tI=0, fAttID, fAtt, locAtts, featSet, rec;
	var locData, fData, newMarker, s;

		// Clear out marker counts
	for (i=0; i<numTmplts; i++)
		this.tLCnt[i] = 0;

	i=0;
	while (i<datastream.l) {
			// If previous "fast-forward" went to empty Template, must go to next
		while (i == -1) {
			if (++tI == numTmplts)
				return;
			else
					// Fast-forward to next Template source
				i = PDataHub.stream1stTEntry(datastream, tI);
		}
			// Starting with new Template?
		if (locAtts == null) {
			locAtts = this.vFrame.getSelLocAtts(tI);
			self.tLCnt[tI] = locAtts.length;
// console.log("tIndex: "+tI+"; locAtts: "+JSON.stringify(locAtts));
				// Skip Template if no locate Atts
			if (locAtts.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tI == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tI);
					continue;
				}
			} // if no locAtts
			featSet = self.vFrame.getSelFeatAtts(tI);
// console.log("tIndex: "+tI+"; featAtts: "+JSON.stringify(featAtts));

				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tI == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tI);
					continue;
				}
			} // if no featAtts
				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PDataHub.getAttID(fAttID);
		} // if new Template
			// Get Record data
		aI = datastream.s[i];
		rec = PDataHub.getRecByIndex(aI);
			// For each of the locate Attributes
		locAtts.forEach(function(theLAtt) {
			locData = rec.a[theLAtt];
			if (locData) {
				if (fData = rec.a[fAttID]) {
					fData = PDataHub.getAttLgndVal(fData, fAtt, featSet, false);
					if (fData) {
// console.log("Record "+i+"["+fAttID+"]: "+rec.a[fAttID]+" = "+fData);
							// TO DO: Handle PNG icons
						s = self.vFrame.isSel(i);
						if (typeof locData[0] == 'number') {
							newMarker = L.circleMarker(locData,
								{	_aid: aI, weight: 1, radius: rad,
									fillColor: fData, color: s ? "#ff0000" : "#000",
									opacity: 1, fillOpacity: 1
								}
							);
						} else {
							if (locData.length == 2) {
								// draw line
							} else {
								// draw polygon
							}
						}
						newMarker.on('click', markerClick);
						mLayer.addLayer(newMarker);
					}
				}
			}
		}); // for locAtts
			// Increment stream index -- check if going into new Template
		if (++i == (datastream.t[tI].i + datastream.t[tI].n)) {
			locAtts = null;
			tI++;
		}
	} // while 
} // render()

VizMap.prototype.clearSelection = function()
{
	this.markerLayer.eachLayer(function(marker) {
		marker.setStyle({ color: "#000" });
	});
} // clearSelection()


// ==========================================================
// VizDirectory: Class to visualize lists of Template records


var VizDirectory = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizDirectory

VizDirectory.prototype = Object.create(PVizModel.prototype);

VizDirectory.prototype.constructor = VizDirectory;

VizDirectory.prototype.usesLegend = function()
{
	return false;
} // usesLegend()


VizDirectory.prototype.setup = function()
{
	var self = this;
	var vIndex = this.vFrame.getIndex();

		// Insert a scrolling container
	jQuery(this.frameID).append('<div id="directory-'+vIndex+'" class="scroll-container"></div>');

		// Listen for clicks on it
	jQuery('#directory-'+vIndex).click(function(event) {
		if (event.target.nodeName == 'TD') {
			var row = jQuery(event.target).closest('tr');
			var absI = row.data('aid');
			var s = self.vFrame.toggleSel(absI);
			if (s)
				row.addClass("obj-selected");
			else
				row.removeClass("obj-selected");
		}
	});
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizDirectory.prototype.render = function(datastream)
{
	var self = this;

	var numTmplts = PDataHub.getNumETmplts();
	var i=0, aI, tI=0, tID, tRec, tDef;
	var insert=null, fAtts, datum, rec, t;

	var vIndex = this.vFrame.getIndex();

	jQuery('#directory-'+vIndex).empty();

	tRec = datastream.t[0];
	while (i<datastream.l) {
			// Advance until we get to current Template rec
		while (tRec.n == 0 || (tRec.i+tRec.n) == i) {
				// Have we run out of Templates?
			if (++tI == numTmplts)
				return;
			tRec = datastream.t[tI];
			insert = null;
		}
			// Starting with new Template? Create new table
		if (insert == null) {
// console.log("Starting new Template: "+tI);
			tID = PDataHub.getETmpltIndex(tI);
			tDef = PDataHub.getTmpltID(tID);
			jQuery('#directory-'+vIndex).append('<div class="directory-label">'+tDef.l+'</div>'+
				'<table cellspacing="0" class="viz-directory" data-id="'+tID+'"></table>');
			insert = jQuery('#directory-'+vIndex+' table[data-id="'+tID+'"]');
			fAtts = self.settings.cnt[tI];
			t = '<thead><tr><th>Name</th>';
			fAtts.forEach(function(theAtt) {
				var att = PDataHub.getAttID(theAtt);
				t += '<th>'+att.def.l+'</th>';
			})
			insert.append(t+'<tr></thead><tbody></tbody>');
			insert = insert.find('tbody');
		} // if new Template

			// Get Record data
		aI = datastream.s[i];
// console.log("Next record: "+i+" (absI) "+aI);
		rec = PDataHub.getRecByIndex(aI);
		t = '<tr data-id="'+rec.id+'" data-aid="'+aI+'"';
		if (self.vFrame.isSel(aI))
			t += ' class="obj-selected" '
		t += '><td>'+rec.l+'</td>';
		fAtts.forEach(function(attID) {
			datum = rec.a[attID];
			if (datum) {
				datum = PDataHub.procAttVal(attID, datum);
				// datum = PDataHub.getRecAtt(aI, attID, false);
				if (datum) {
					t += '<td>'+datum+'</td>';
				} else {
					t += '<td></td>';
				}
			} else {
				t += '<td></td>';
			}
		});
		insert.append(t+'</tr>');
			// Increment stream index
		i++;
	} // while 
} // render()

VizDirectory.prototype.clearSelection = function()
{
	var vIndex = this.vFrame.getIndex();

	jQuery('#directory-'+vIndex+' tr').removeClass('obj-selected');
} // clearSelection()



// ====================================================================
// PFilterModel: An abstract class to be subclassed by specific filters

	// INPUT: 	id = unique ID for this filter
	//			attRec = pointer to complete Attribute or Facet Browser settings
	// ASSUMES: required is true by default
function PFilterModel(id, attRec)
{
	this.id 		= id;
	this.att 		= attRec;

	this.dirty 		= true;
	this.req 		= true;

		// All subclasses must implement the following:
	// this.title()
	// this.setUp()
	// this.evalPrep()
	// this.eval(rec)
} // PFilterModel

	// PURPOSE: Either set or get dirty state of Filter
	// RETURNS: true if filter is "dirty" (has been changed and thus forces recompute)
	// INPUT:   null if only retrieving state, else true or false
PFilterModel.prototype.isDirty = function(setDirty)
{
	if (setDirty != null) {
		this.dirty = setDirty;
		if (setDirty)
			jQuery('#btn-recompute').addClass('highlight');
	}
	return this.dirty;
} // isDirty

	// PURPOSE: Either set or get setting if Filter value is required
	// RETURNS: true if Attribute is required by Filter, false if records without pass through
	// INPUT:   null if only retrieving state, else true or false
PFilterModel.prototype.isReq = function(setReq)
{
	if (setReq != null) {
		if (this.req != setReq)
			this.isDirty(true);
		this.req = setReq;
	}
	return this.dirty;
} // isReq

	// PURPOSE: Return title for filter component
	// NOTES: 	Handles default case of Attribute label
PFilterModel.prototype.title = function()
{
	return this.att.def.l;
} // title()

	// PURPOSE: Return jQuery result for contents of this filter
PFilterModel.prototype.insertPt = function()
{
	return jQuery('.filter-instance[data-id="'+this.id+'"] .filter-body');
} // insertPt()


// ============================================
// PFilterText: Class to filter Text Attributes

var PFilterText = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterText()

PFilterText.prototype = Object.create(PFilterModel.prototype);

PFilterText.prototype.constructor = PFilterText;

PFilterText.prototype.evalPrep = function()
{
	this.findStr = this.insertPt().find('.filter-text').val();
} // evalPrep()

PFilterText.prototype.eval = function(rec)
{
	var str = this.findStr;

	if (str == null || str == '')
		return true;

	var txt = rec.a[this.att.id];
	if (typeof txt == 'undefined') {
		if (this.req)
			return false;
		return true;
	}
// console.log("Text value = "+txt);
	return txt.indexOf(str) != -1;
} // eval()

PFilterText.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = jQuery('#txt-load-filter-text').html().trim();
	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('.filter-text').change(function() {
		self.isDirty(true);
	});
} // setup()


// ===================================================
// PFilterVocab: Class to filter Vocabulary Attributes

var PFilterVocab = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterVocab()

PFilterVocab.prototype = Object.create(PFilterModel.prototype);

PFilterVocab.prototype.constructor = PFilterVocab;

PFilterVocab.prototype.evalPrep = function()
{
} // evalPrep()

PFilterVocab.prototype.eval = function(rec)
{
} // eval()

PFilterVocab.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = jQuery('#txt-load-filter-text').html().trim();
	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('.filter-text').change(function() {
		self.isDirty(true);
	});
} // setup()


// ================================================
// PFilterNum: Class to filter Number Attributes

var PFilterNum = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterNum()

PFilterNum.prototype = Object.create(PFilterModel.prototype);

PFilterNum.prototype.constructor = PFilterNum;

PFilterNum.prototype.evalPrep = function()
{
} // evalPrep()

PFilterNum.prototype.eval = function(rec)
{
} // eval()

PFilterNum.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();

	var fh = _.template(jQuery('#txt-load-filter-number').html());
	inserted.append(fh({ min: this.att.r.min, max: this.att.r.max }));

		// Intercept changes to input
	// inserted.find('.filter-##').change(function() {
	// 	self.isDirty(true);
	// });
} // setup()


// ========================================================================
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)

// INPUT: 	vizIndex = index for this visualization frame (0 or 1)

function PViewFrame(vizIndex)
{
	var instance = { };			// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var state = PSTATE_INIT;	// One of PSTATE_
	var vizSelIndex = 0;		// index of currently selected Viz
	var vizModel = null;		// PVizModel currently in frame
	var legendIDs = [];			// Attribute IDs of Legend selections (one per Template)
	var recSel = [];			// array of absolute indices of selected Records in sorted order
	var datastream = null;		// pointer to datastream given to view

	// PRIVATE FUNCTIONS
	//==================

		// PURPOSE: Return ID of Frame's outermost DIV container
	function getFrameID()
	{
		return '#view-frame-'+vizIndex;
	} // getFrameID()


	function selectChangeViz(event)
	{
		var selector = jQuery(getFrameID()+' .view-control-bar .view-viz-select option:selected');
		var newSelIndex   = selector.val();
		createViz(newSelIndex);
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		if (vizModel.usesLegend()) {
			jQuery(getFrameID()+' .legend-container').toggle('slide', {direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()


		// PURPOSE: Open Inspector modal for current selection
	function clickOpenSelection(event)
	{
		if (recSel.length == 0)
			return;

		var inspector;
		var i=0;

		function inspectShow()
		{
			var recAbsI = recSel[i];
			var rec = PDataHub.getRecByIndex(recAbsI);
			var title = ' '+rec.l+' ('+(i+1)+'/'+recSel.length+') ';
			jQuery('#inspect-name').text(title);
				// Which template type?
			var tI = PDataHub.aIndex2Tmplt(recAbsI);
				// Show all data
			var container = jQuery('#inspect-content');
			container.empty();
// console.log("Show atts: "+JSON.stringify(prspdata.e.p.modal.atts[tI]));
			prspdata.e.p.modal.atts[tI].forEach(function(attID) {
				var attVal = PDataHub.getRecAtt(recAbsI, attID, false);
// console.log("AttID: "+attID+"; val: "+attVal);
				if (attVal) {
					var theAtt = PDataHub.getAttID(attID);
					var html = '<div><span class="att-label">'+theAtt.def.l+':</span> '+attVal+'</div>';
					container.append(html);
				}
			});
		} // inspectShow()

		function inspectSlide(diff)
		{
			var newI = i+diff;
			if (newI == -1)
				newI = recSel.length-1;
			else if (newI == recSel.length)
				newI = 0;

			if (newI != i) {
				i = newI;
				inspectShow();
			}
		} // inspectSlide()

		function inspectLeft(event)
		{
			inspectSlide(-1);
		}
		function inspectRight(event)
		{
			inspectSlide(1);
		}

			// Show first item
		inspectShow();
		jQuery('#btn-inspect-left').click(inspectLeft);
		jQuery('#btn-inspect-right').click(inspectRight);

			// TO DO: Determine size based on extra widgets
		inspector = jQuery("#dialog-inspector").dialog({
			height: 300,
			width: 400,
			modal: true,
			buttons: {
				'See Record': function() {
					// TO DO: AJAX call to get_permalink() to get URL!
				},
				Close: function() {
					jQuery('#btn-inspect-left').off("click");
					jQuery('#btn-inspect-right').off("click");
					inspector.dialog("close");
				}
			}
		});

		event.preventDefault();
	} // clickOpenSelection()

	function doClearSel()
	{
			// Reset array
		recSel = [];
		if (vizModel)
			vizModel.clearSelection();
	} // doClearSel

	function clickClearSelection(event)
	{
		doClearSel();
		event.preventDefault();
	} // clickClearSelection()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizControls(event)
	{
		event.preventDefault();
	} // clickVizControls()

		// PURPOSE: Turn on or off all feature Attributes for tmpltIndex
	function doShowHideAll(tmpltIndex, show)
	{
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-entry-check').prop('checked', show);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
// console.log("Locate attribute "+lID+" for template "+tmpltIndex+", set to "+show);
	} // doLocateSelect()


		// PURPOSE: Make vIndex the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
// console.log("Locate attribute "+lID+" only for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-locate .legend-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-locate[data-id="'+lID+'"] .legend-entry-check').prop('checked', true);
	} // doLocateSelect()


		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
// console.log("Feature attribute "+vIndex+" for template "+tmpltIndex+", set to "+show);
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
// console.log("Feature attribute "+vIndex+" only selected for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-value[data-index="'+vIndex+
								'"] .legend-entry-check').prop('checked', true);
	} // doFeatureSelectOnly()


		// PURPOSE: Handle click anywhere on Legend
		// TO DO: 	Handle 2ndary level (Vocab) items properly, logically??
	function clickInLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'legend-update':
			if (vizModel && datastream) {
					// TO DO: Set busy cursor
				vizModel.render(datastream);				
			}
			break;
			// Turn on or off just this one value
		case 'legend-entry-check':
			var lEntry = jQuery(event.target).closest('.legend-entry');
			var isChecked = jQuery(event.target).is(':checked');
				// What does checkbox belong to?
			if (lEntry.hasClass('legend-sh'))
				doShowHideAll(tmpltIndex, isChecked);
				// A locate Attribute?
			else if (lEntry.hasClass('legend-locate'))
				doLocateSelect(tmpltIndex, lEntry.data('id'), isChecked);
					// Must belong to a legend-entry
			else if (lEntry.hasClass('legend-value'))
				doFeatureSelect(tmpltIndex, lEntry.data('index'), isChecked);
			break;

			// Make this only selected feature attribute
		case 'legend-viz':
		case 'legend-value-title': 		// Title used for both locate and feature Attributes!
			var lEntry = jQuery(event.target).closest('.legend-entry');
			if (lEntry.hasClass('legend-locate'))
				doLocateSelectOnly(tmpltIndex, lEntry.data('id'));
			else if (lEntry.hasClass('legend-value'))
				doFeatureSelectOnly(tmpltIndex, lEntry.data('index'));
			break;

		case 'legend-template':
		case 'legend-select':
		case '':
				// Ignore these
			break;

		default:  // could be multiple
				// Show/Hide title?
			if (clickClass.match(/legend-sh/i)) {
					// Simulate click
				var checkBox = jQuery(event.target).find('.legend-entry-check');
				var isChecked = !checkBox.is(':checked');
				checkBox.prop('checked', isChecked);
				doShowHideAll(tmpltIndex, isChecked);
			}
			break;
		}
	} // clickInLegend()


		// PURPOSE: Handle selecting a feature Attribute for a Template from menu
	function selectTmpltAttribute(event)
	{
			// Determine Template to which this refers
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
		var attID = jQuery(event.target).val();
		setLegendFeatures(tmpltIndex, attID);
	} // selectTmpltAttribute()


		// PURPOSE: Set feature attributes in Legend
		// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
		//			attID = ID of feature Attribute in the Legend set
		// NOTES: 	Does not affect menu selection itself
	function setLegendFeatures(lIndex, attID)
	{
		var element;

		var group = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
						lIndex+'"] .legend-group');
			// Clear any previous entries
		group.empty();
		legendIDs[lIndex] = attID;
			// Insert new items
		var attDef = PDataHub.getAttID(attID);
		attDef.l.forEach(function(legEntry, lgIndex) {
				// TO DO: Account for both icons and colors acc. to v string
			element = '<div class="legend-value legend-entry" data-index="'+lgIndex+'"><input type="checkbox" checked="checked" class="legend-entry-check"/>'+
						'<div class="legend-viz" style="background-color: '+legEntry.v+'"> </div> <span class="legend-value-title">'+legEntry.l+'</span></div>';
			group.append(element);
			if (legEntry.z && legEntry.z.length > 0) {
				legEntry.z.forEach(function(zEntry, zIndex) {
					element = '<div class="legend-value legend-entry" data-index="'+lgIndex+','+zIndex+
								'"><input type="checkbox" checked="checked" class="legend-entry-check"/>';
					if (zEntry.v && zEntry.v != '') {
						element += '<div class="legend-viz" style="background-color: '+zEntry.v+'"></div>';
					} else {
						element += '<div class="legend-viz legend-viz-empty"></div>';
					}
					element += ' <span class="legend-value-title"> > '+zEntry.l+'</span></div>';
					group.append(element);
				});
			}
		});
	} // setLegendFeatures()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vIndex is index in Exhibit array
	function createViz(vIndex)
	{
		var theView = PDataHub.getVizIndex(vIndex);

			// Remove current viz content
		if (vizModel)
			vizModel.teardown();

		jQuery(getFrameID()+' .viz-content .viz-result').empty();

		switch (theView.vf) {
		case 'Map':
			vizModel = new VizMap(instance, theView.c);
			break;
		case 'Cards':
			break;
		case 'Pinboard':
			break;
		case 'Timeline':
			break;
		case 'Tree':
			break;
		case 'Flow':
			break;
		case 'Directory':
			vizModel = new VizDirectory(instance, theView.c);
			break;
		}
		vizSelIndex = vIndex;

			// Does Viz support Legend at all?
		if (vizModel.usesLegend()) {
				// Clear out previous Legend
				// remove all previous locate Attributes
			var lgndCntr = jQuery(getFrameID()+' .legend-container .legend-scroll');
			lgndCntr.empty();

				// Create Legend sections for each Template
			prspdata.e.g.ts.forEach(function(tID, tIndex) {
				var tmpltDef = PDataHub.getTmpltID(tID);
					// Insert locate attributes into Legends
				var locAtts = vizModel.getLocAtts(tIndex);
				if (locAtts && locAtts.length) {
							// Create DIV structure for Template's Legend entry
					var newTLegend = jQuery('<div class="legend-template" data-index="'+tIndex+
									'"><div class="legend-title">'+tmpltDef.l+'</div></div>');
					locAtts.forEach(function(attID, aIndex) {
						var attDef = PDataHub.getAttID(attID);
						newTLegend.append('<div class="legend-entry legend-locate" data-id="'+attID+
							'"><input type="checkbox" checked="checked" class="legend-entry-check"/><span class="legend-value-title">'+
							attDef.def.l+'</span></div>');
					});
						// Create dropdown menu of visual Attributes
					var attSelection = vizModel.getFeatureAtts(tIndex);
					var newStr = '<select class="legend-select">';
					attSelection.forEach(function(attID, aIndex) {
						var attDef = PDataHub.getAttID(attID);
						newStr += '<option value="'+attID+'">'+attDef.def.l+'</option>';
					});
					newStr += '</select>';
					var newSelect = jQuery(newStr);
					newSelect.change(selectTmpltAttribute);
					jQuery(newTLegend).append(newSelect);
						// Create Hide/Show all checkbox
					jQuery(newTLegend).append('<div class="legend-entry legend-sh"><input type="checkbox" checked="checked" class="legend-entry-check"/>Hide/Show All</div><div class="legend-group"></div>');
					lgndCntr.append(newTLegend);
					if (tIndex != (prspdata.t.length-1))
						lgndCntr.append('<hr/>');
						// Default feature selection is first Attribute
					var fAttID = attSelection.length > 0 ? attSelection[0] : null;
					legendIDs.push(fAttID);
					if (fAttID) 
						setLegendFeatures(tIndex, fAttID);
				}
			});
			jQuery(getFrameID()+' .legend-container').show();
		} else {
				// Just hide Legend
			jQuery(getFrameID()+' .legend-container').hide();
		}
		vizModel.setup();

		if (datastream)
			vizModel.render(datastream);		
	} // createViz()


	// INSTANCE METHODS
	//=================

	instance.getFrameID = getFrameID;

	instance.getIndex = function()
	{
		return vizIndex;
	};

		// PURPOSE: Initialize basic DOM structure for ViewFrame
	instance.initDOM = function()
	{
		var head = jQuery(getFrameID()+' .view-control-bar .view-viz-select');
			// Set Dropdown to View names
		prspdata.e.vf.forEach(function(theVF, i) {
			var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
			head.append(optionStr);
		});
		head.change(selectChangeViz);

			// Hook control bar Icon buttons
		head = jQuery(getFrameID()+' .view-control-bar button:first');
		head.button({icons: { primary: 'ui-icon-bookmark' }, text: false })
				.click(clickShowHideLegend).next()
				.button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(clickOpenSelection).next()
				.button({icons: { primary: 'ui-icon-close' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-gear' }, text: false })
				.click(clickVizControls).next();

		head = jQuery(getFrameID()+' .viz-content .legend-container');
		head.click(clickInLegend);

			// Create first VF by default
		createViz(0);

		state = PSTATE_REQ;
	}; // initDOM()


		// RETURNS: Array of currently selected locate Attribute IDs for tIndex
	instance.getSelLocAtts = function(tIndex)
	{
		var attIDs = [];
		var boxes = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
							tIndex+'"] .legend-locate input:checked');
		boxes.each(function() {
			var attID = jQuery(this).parent().data('id');
			attIDs.push(attID);
		});
		return attIDs;
	}; // getSelLocAtts()


		// RETURNS: Array of indices of currently selected feature Attribute IDs for tIndex
		// NOTE: 	Indices are in dot notation for 2ndary-level (x.y)
	instance.getSelFeatAtts = function(tIndex)
	{
		var attIndices = [], attIndex, i;
		var boxes = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
							tIndex+'"] .legend-group .legend-value input:checked');
		boxes.each(function() {
			attIndex = jQuery(this).parent().data('index');
			if (typeof attIndex == 'number') {
				attIndices.push(attIndex);
			} else {
				if ((i=attIndex.indexOf(',')) != -1) {
					attIndices.push([parseInt(attIndex.substring(0,i),10), parseInt(attIndex.substring(i+1),10)]);
				} else
					attIndices.push(parseInt(attIndex,10));
			}
		});
		return attIndices;
	}; // getSelFeatAtts()


		// RETURNS: Attribute ID selected on Legend for tIndex
	instance.getSelLegend = function(tIndex)
	{
		return legendIDs[tIndex];
	} // getSelLegend()


	instance.getState = function()
	{
		return state;
	} // getState()

		// PURPOSE: Toggle presence of record (by absolute index) in selection list
		// NOTES: 	Called by VizModel based on user interaction
		// RETURNS: true if didn't exist (added), false if existed (removed)
	instance.toggleSel = function(recAbsI)
	{
		var i = _.sortedIndex(recSel, recAbsI);
		if (recSel[i] == recAbsI) {
			recSel.splice(i, 1);
			return false;
		} else {
			recSel.splice(i, 0, recAbsI);
			return true;
		}
	} // toggleSel()

		// RETURNS: True if record ID is in selected list
	instance.isSel = function(recAbsI)
	{
		var i = _.indexOf(recSel, recAbsI, true);
		return (i != -1);
	} // isSel()

	instance.clearSel = function()
	{
		doClearSel();
	} // clearSel()

		// PURPOSE: Called by external agent when new datastream is available for viewing
		// ASSUMED: Caller has already set busy cursor
		// TO DO: 	Check and set frameState
	instance.showStream = function(stream)
	{
		datastream = stream;
		if (vizModel)
			vizModel.render(stream);
	} // showStream()

	instance.setStream = function(stream)
	{
		datastream = stream;
	} // setStream()

	return instance;
} // PViewFrame


// ==========================================================
// PDataHub
// PURPOSE: Manages all data, orchestrates data streams, etc.

// USES: jQuery (for AJAX)

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			PDataHub is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// The s array of an IndexStream contains absolute index numbers to global data array
// TO DO: 	Change LOAD_DATA_CHUNK to Option setting passed by prspdata


var PDataHub = (function () {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;


	// INTERNAL VARIABLES
	// ==================

	var allData = [];				// "head" array of all Records, one entry per Template type
									// Corresponding to prspdata.t
									// { n = # loaded, i = initial index for these records, d = data array }
	var allDataCount=0;				// Total number of Records


	// INTERNAL FUNCTIONS
	// ==================


		// PURPOSE: Load a particular chunk of Records
	function loadAJAXRecs(tIndex, from, count)
	{
		jQuery.ajax({
			type: 'POST',
			url: prspdata.ajax_url,
			data: {
				action: 'prsp_get_records',
				tmplt_id: prspdata.t[tIndex].id,
				from: from,
				count: count
			},
			success: function(data, textStatus, XMLHttpRequest)
			{
					// Append loaded data, update and look for more
				var d = allData[tIndex].d;
				var newD = JSON.parse(data);
				if (d)
					allData[tIndex].d = d.concat(newD);
				else
					allData[tIndex].d = newD;
				allData[tIndex].n += count;
				checkDataLoad();
			},
			error: function(XMLHttpRequest, textStatus, errorThrown)
			{
			   alert(errorThrown);
			}
		});
	} // loadAJAXRecs()


		// PURPOSE: Look for set of Records that haven't been loaded and request
	function checkDataLoad()
	{
		var done = true;

		for (var i=0; i<prspdata.t.length; i++) {
			var current = allData[i].n;
			var needed = prspdata.t[i].n;
			if (current < needed) {
				done = false;
				var gap = needed - current;
				var size = gap < LOAD_DATA_CHUNK ? gap : LOAD_DATA_CHUNK;
				loadAJAXRecs(i, current, size);
					// Since this is a recursive action, break on first find
				break;
			}
		}
		if (done) {
// console.log("Done loading: "+JSON.stringify(allData));
			jQuery('#btn-recompute').addClass('highlight');
			setTimeout(function(){ jQuery('#loading-message').hide(); }, 1000);
			jQuery("body").trigger("prospect", { pstate: PSTATE_PROCESS, component: 0 });
		}
	} // checkDataLoad()


	// PUBLIC INTERFACE
	// ================

	return {
			// PURPOSE: Initialize data hub, initiate data loading
		init: function()
		{
				// For each entry: head entry for Record Data and collect Legends
			prspdata.t.forEach(function(tmplt) {
					// Head Record entry
				var newTData = { i: allDataCount, n: 0, d: null };
				allData.push(newTData);
				allDataCount += tmplt.n;
			});
			checkDataLoad();
		}, // init()


			// PURPOSE: Create Date object from three numbers
			// INPUT:   year, month, day must be definite numbers
			// ASSUMES: month is 0-based (not 1-based: 0=January)
		date3Nums: function(year, month, day)
		{
			var date;

			if (year < 0 || year > 99) { // 'Normal' dates
				date = new Date(year, month, day);
			} else if (year == 0) { // Year 0 is '1 BC'
				date = new Date (-1, month, day);
			} else {
				// Create arbitrary year and then set the correct year
				date = new Date(year, month, day);
				date.setUTCFullYear(("0000" + year).slice(-4));
			}
			return date;
		}, // date3Nums

			// PURPOSE: Create Date object from three strings
		date3Strs: function(yStr, mStr, dStr, from)
		{
			var yearBCE;
			var year, month, day;

				// First check for negative year
			if (yStr.charAt(0) == '-') {
				yearBCE = true;
				yStr = yStr.substring(1);
			} else {
				yearBCE = false;
			}

			year = parseInt(yStr);
			if (yearBCE) {
				year = -year;
			}

				// If it's a start date, defaulted data must be early as possible
			if (dStr == null || dStr === '') {
				if (mStr == null || mStr ==='') {
					if (from) {
						month = 0; day = 1;
					} else {
						month = 11; day = 31;
					}
				} else {
					month = parseInt(mStr) - 1;
					if (from) {
						day = 1;
					} else {
						day = 31;
					}
				}
			} else {
				month = parseInt(mStr) - 1;
				day = parseInt(dStr);
			}

			return PDataHub.date3Nums(year, month, day);
		}, // date3Strs()

			// PURPOSE: Parse a text string as Date object
			// RETURNS: Date object or null if error
			// INPUT:   dateString = string itself containing Date
			//          from = true if it is the from Date, false if it is the to Date
			// ASSUMES: dateString has been trimmed; can ignore fuzzy char ~
			// NOTE:    month # is 0-based!!
		parseDate: function(dateString, from)
		{
			var strComponents;
			var yearBCE;
			var year, month, day;

				// Check for fuzzy char indicator -- but discard if exists
			if (dateString.charAt(0) == '~') {
				dateString = dateString.substring(1);
			}

				// Check for negative year
			if (dateString.charAt(0) == '-') {
				yearBCE = true;
				dateString = dateString.substring(1);
			} else {
				yearBCE = false;
			}

			strComponents = dateString.split('-');

				// Year must be supplied at very least
			year = parseInt(strComponents[0]);
			if (yearBCE) {
				year = -year;
			}
				// If it's a start date, we want defaulted data to be early as possible
			switch (strComponents.length) {
			case 3:
				month = parseInt(strComponents[1]) - 1;
				day = parseInt(strComponents[2]);
				break;
			case 2:
				month = parseInt(strComponents[1]) - 1;
				if (from) {
					day = 1;
				} else {
					day = 31;
				}
				break;
			case 1:
				if (from) {
					month = 0; day = 1;
				} else {
					month = 11; day = 31;
				}
				break;
			} // switch

			return PDataHub.date3Nums(year, month, day);
		}, // parseDate()


			// PURPOSE: Create event object by parsing Date range string (which can have from & to)
			// RETURNS: Event object whose bitwise flags field represent three properties:
			//              timeInstant = is this an instantaneous event?
			//              timeFuzzyStart = is the beginning event fuzzy?
			//              timeFuzzyEnd = is the end event fuzzy?
			// INPUT:   dStr = text string representing a Date (range)
			//          minBound = minimum Date in range
			//          maxBound = maximum Date in range
		eventDateStr: function(dStr, minBound, maxBound)
		{
			var newEvent = { flags: 0 };

			var dateSegs = dStr.split('/');

			var start = dateSegs[0].trim();
			if (start === 'open') {
				newEvent.start = minBound;
			} else {
				if (start.charAt(0) === '~') {
					start = start.substr(1);
					newEvent.flags |= EVENT_F_START;
				}
				newEvent.start = PDataHub.parseDate(start, true);
			}

				// Is it a range of from/to?
			if (dateSegs.length == 2) {
				var end = dateSegs[1].trim();
				if (end === 'open') {
					newEvent.end = maxBound;
				} else {
					if (end.charAt(0) === '~') {
						end = end.substr(1);
						newEvent.flags |= EVENT_F_END;
					}
					newEvent.end = PDataHub.parseDate(end, false);
				}

				// Otherwise an instantaneous event -- just set to start Date
			} else {
				newEvent.flags |= EVENT_INSTANT;
				newEvent.end = newEvent.start;
			}

			return newEvent;
		}, // eventDateStr()

			// PURPOSE: Create event object from Attribute val
		eventDateStr: function(dVal, minBound, maxBound)
		{
		}, // eventDateStr()

			// PURPOSE: Create a new IndexStream: { s = index array, t = array of template params, l = total length }
			// INPUT: 	if full, fill with entries for all Records
			// NOTE: 	JS Arrays are quirky; s is always full size, so l is used to maintain length
		newIndexStream: function(full)
		{
			var newStream = { };
			newStream.s = new Uint16Array(allDataCount);
			newStream.t = [];
			newStream.l = 0;

			if (full) {
				var i;
				for (i=0; i<allDataCount; i++)
					newStream.s[i] = i;
				for (i=0; i<allData.length; i++) {
					var tEntry = allData[i];
					var newEntry = { i: tEntry.i, n: tEntry.n };
					newStream.t.push(newEntry);
				}
				newStream.l = allDataCount;
			}
			return newStream;
		}, // newIndexStream()


			// RETURNS: Index of Template to which absolute index <absI> belongs
		aIndex2Tmplt: function(absI)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.i <= absI  && absI < (tData.i+tData.n))
					return i;
			}
		}, // aIndex2Tmplt()


			// RETURNS: The index of first entry in <datastream> which belongs to Template <tIndex>
			//			-1 if the Template has no entries
			// NOTE: 	This is for effectively "fast-forwarding" to a particular Template section
			// 			This is tricky because binary-search needs to look for range
		stream1stTEntry: function(datastream, tIndex)
		{
			var tEntry = datastream.t[tIndex];
			if (tEntry.n == 0)
				return -1;
			return tEntry.i;
		}, // stream1stTEntry()


			// RETURNS: Object for Record whose absolute index is <absI>
		getRecByIndex: function(absI)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.n > 0) {
					if (tData.i <= absI  && absI < (tData.i+tData.n))
						return tData.d[absI - tData.i];
				}
			}
			return null;
		}, // getRecByIndex()

			// RETURNS: Attribute value in string format
			// INPUT: 	attID = ID of Attribute
			//			a = raw attribute data
		procAttVal: function(attID, a)
		{
			var att = PDataHub.getAttID(attID);
			switch (att.def.t) {
			case 'Vocabulary':
				return a.join();
			case 'Text':
				return a;
			case 'Number':
				return a.toString();
			case 'Dates':
				var ds;
					// Range
				if (a.max) {
					ds = 'From ';
					if (a.min.f)
						ds += 'no later than ';
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
					ds += ' to ';
					if (a.max.f)
						ds += 'at least ';
					ds += a.max.y.toString();
					if (a.max.m) {
						ds += '-'+a.max.m.toString();
						if (a.max.d)
							ds += '-'+a.max.d.toString();
					}
				} else {
					if (a.min.f)
						ds = 'Approximately ';
					else
						ds = '';
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
				}
				return ds;
			case 'Lat-Lon':
			case 'X-Y':
				return a.join();
				// return a[0].toString()+', '+a[1].toString();
			case 'Image':
				return '<img src="'+a+'" alt="'+att.def.l+'"/>';
			case 'Link To':
				return '<a href="'+a+'" target="_blank">(See Link)</a>';
			case 'SoundCloud':
				return '<a href="'+a+'" target="_blank">(SoundCloud)</a>';
			case 'YouTube':
				return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
			case 'Transcript':
				return '<a href="'+a+'" target="_blank">(See Transcript File)</a>';
			case 'Timecode':
				return a;
			case 'Pointer':
				// TO DO -- ?? What to do??
				return a;
			// case 'Join': 	// Should not appear
			} // switch
			return null;
		}, // procAttVal()

			// RETURNS: Attribute value for <attID> in Record whose absolute index is <index>,
			//				or null if either is non-existent
			// INPUT: 	If <raw>, return as is; otherwise, turn into string/HTML
			// TO DO: 	Process data?
		getRecAtt: function(absI, attID, raw)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.n > 0 && tData.i <= absI  && absI < (tData.i+tData.n)) {
					var rec = tData.d[absI - tData.i];
					var a = rec.a[attID];
					if (a == null || typeof a == 'undefined')
						return null;
					if (raw)
						return a;
					return PDataHub.procAttVal(attID, a);
				}
			}
			return null;
		}, // getRecAtt()

			// RETURNS: Absolute index for Record whose ID is recordID
		getRecIndexByID: function(recordID)
		{
				// TO DO: Binary search for each Template array
		}, // getRecIndexByID()


			// RETURNS: Attribute definition with this ID
			// INPUT:   attID = full Attribute ID (could be in Join dot notation)
			// TO DO: 	Use Intl.Collator for string compare??
		getAttID: function(attID)
		{
			var lo = 0;
			var hi = prspdata.a.length;
			var pos, cmp;

			while (lo <= hi) {
				pos = (lo + hi) >> 1;
				cmp = prspdata.a[pos].id.localeCompare(attID);

				if (cmp < 0) {
					lo = pos + 1;
				} else if (cmp > 0) {
					hi = pos - 1;
				} else {
					return prspdata.a[pos];
				}
			}
			return null;
		}, // getAttID()

		getAttIndex: function(aIndex)
		{
			return prspdata.a[aIndex];
		}, // getAttIndex()

			// RETURNS: Number of Templates used by this Exhibit
		getNumETmplts: function()
		{
			return prspdata.e.g.ts.length;
		},

			// RETURNS: The ID of this Exhibit's tIndex Template
		getETmpltIndex: function(tIndex)
		{
			return prspdata.e.g.ts[tIndex];
		},

			// RETURNS: Definition of template whose ID is tID
		getTmpltID: function(tID)
		{
			for (var i=0; i<prspdata.t.length; i++) {
				if (tID == prspdata.t[i].id)
					return prspdata.t[i].def;
			}
		}, // getTmpltID()

			// RETURNS: The visual feature for an Attribute value, an array (if all), or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			att = full Attribute entry
			//			fSet = array of selected Legend indices ([x,y] for 2ndary level!)
			//			all = return array for all possible matches for <val> (true), or just first match (false)
		getAttLgndVal: function(val, att, fSet, all)
		{
			var fI, lI = fSet.length, lE;

			switch (att.def.t) {
			case 'Vocabulary':
					// TO DO: Handle 2ndary settings properly (index val x.y)
				function s(v) {
					for (var f=0; f<lI; f++) {
						fI = fSet[f];
							// Parent-level 
						if (typeof fI === 'number') {
							lE = att.l[fI];
							if (lE.l == v)
								return lE.v;
							// Secondary-level
						} else {
							lE = att.l[fI[0]];
							var lE2 = lE.z[fI[1]];
							if (lE2.l == v) {
								if (lE2.v && lE2.v != '')
									return lE2.v;
								else
									return lE.v;
							}
						}
					}
					return null;
				} // s()
					// Return all possible matched atts?
				if (all && att.def.d != '') {
					var r = [], f;
					val.forEach(function(v) {
						f = s(v);
						if (f != null)
							r.push(f);
					});
					return r.length > 0 ? r : null;
				} else {
						// Could be multiple values, but just return first success
					if (att.def.d != '') {
						var f;
						for (var vI=0; vI<val.length; vI++) {
							f = s(val[vI]);
							if (f != null)
								return f;
						}
						return null;
					} else
						return s(val[0]);
				}
			case 'Text':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// Looking for match anywhere; TO DO: use RegExp?
					if (val.indexOf(lE.d) != -1) {
						return lE.v;
					}
				}
				return null;
			case 'Number':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// either min and max can be left out (= no bound), but not both
					if (lE.d.min) {
						if (lE.d.min <= val) {
							if (lE.d.max) {
								if (val <= lE.d.max)
									return lE.v;
							} else
								return lE.v;
						}
					} else {	// max only
						if (val <= lE.d.max)
							return lE.v;
					}
				}
				return null;
			case 'Dates': 			// Just looking for overlap, date doesn't have to be completely contained
									// Disqualify for overlap if (1) end of event is before min bound, or
									//	(2) start of event is after max bound
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
					if (lE.d.max.y) {		// max bounds
							// Test val maxs against min bound for disqualification
						if (val.max && val.max != 'open') {
							if (val.max.y < lE.d.min.y)
								continue;
							if (val.max.y == lE.d.min.y) {
								if (val.max.m && lE.d.min.m) {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m == lE.d.min.m) {
										if (val.max.d && lE.d.min.d) {
											if (val.max.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
						}
							// Test val mins against max bound for disqualification
						if (val.min.y > lE.d.max.y)
							continue;
						if (val.min.y == lE.d.max.y) {
							if (val.min.m && lE.d.max.m) {
								if (val.min.m > lE.d.max.m)
									continue;
								if (val.min.m == lE.d.max.m) {
									if (val.min.d && lE.d.max.d) {
										if (val.min.d > lE.d.max.d)
											continue;
									}
								}
							}
						}
						return lE.v;
					} else {				// min bound only
							// Event is range
						if (val.max) {
							if (val.max == 'open')		// double open always overlap
								return lE.v;
							if (val.max.y < lE.min.y)
								continue;
							if (val.max.y == lE.min.y) {
								if (val.max.m && lE.d.min.m) {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m == lE.d.min.m) {
										if (val.max.d && lE.d.min.d) {
											if (val.max.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE.v;

							// Single date
						} else {
							if (val.min.y < lE.min.y)
								continue;
							if (val.min.y == lE.min.y) {
								if (val.min.m && lE.d.min.m) {
									if (val.min.m < lE.d.min.m)
										continue;
									if (val.min.m == lE.d.min.m) {
										if (val.min.d && lE.d.min.d) {
											if (val.min.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE.v;
						}
					}
				} // for f
				break;
			}
			return null;
		}, // getAttLgndVal()


		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		} // getVizIndex()
	} // return
})(); // PDataHub


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services, manage filters, …

// USES: 	jQuery, jQueryUI, …
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// VARIABLES
		//==========
	var state = PSTATE_INIT; // current state of Prospect web app
	var view0;				// Primary viewFrame
	var view1;				// Secondary

	var filters = [];		// Filter Stack: { id, f [PFilterModel], out }

	var topStream;			// Top-level IndexStream

		// FUNCTIONS
		//==========

	function doRecompute()
	{
console.log("Start recompute");
		state = PSTATE_BUILD;

			// Recompute must clear current selection
		view0.clearSel();
		if (view1)
			view1.clearSel();

		var endStream;		// Final results to go to views

		if (topStream == null) {
			topStream = PDataHub.newIndexStream(true);
		}
		endStream = topStream;

			// Go through filter stack -- find 1st dirty and recompute from there
		var started=false, fI, theF;
		for (fI=0; fI<filters.length; fI++) {
			theF = filters[fI];
				// If we've started, evaluate and propagate
			if (started || theF.f.isDirty(null)) {
				theF.f.evalPrep();
				var newStream = PDataHub.newIndexStream(false);
				var relI=0, absI, rec;
				var tI=0, tRec=endStream.t[0], tRn=0;
					// Must keep absolute indices and template params updated!
				while (relI < endStream.l) {
						// Advance until we get to current Template rec
					while (tRec.n == 0 || (tRec.i+tRec.n) == relI) {
						newStream.t.push({ i: (newStream.l-tRn), n: tRn });
						tRn = 0;
						tRec = endStream.t[++tI];
					}
					absI = endStream.s[relI++];
					rec = PDataHub.getRecByIndex(absI);
					if (theF.f.eval(rec)) {
						newStream.s[newStream.l++] = absI;
						tRn++;
					}
				}
					// push out any remaining Template recs
				while (tI++ < PDataHub.getNumETmplts()) {
					newStream.t.push( { i: (newStream.l-tRn), n: tRn } );
					tRn = 0;
				}
				theF.f.isDirty(false);
				theF.f.out = newStream;
				endStream = newStream;
				started = true;
console.log("Output stream ["+fI+"]: "+JSON.stringify(newStream));
			} else
				endStream = theF.f.out;
		}
console.log("Filtering complete: visualization beginning");
		view0.showStream(endStream);
		if (view1)
			view1.showStream(endStream);
		jQuery('#btn-recompute').removeClass('highlight');
console.log("Visualization complete");
		state = PSTATE_READY;
	} // doRecompute()

		// TO DO: Check and set frameState; make cursor busy during compute!
	function clickRecompute(event)
	{
		doRecompute();
		event.preventDefault();
	} // clickRecompute()


	function doSetLayout(lIndex)
	{
console.log("Set layout to: "+lIndex);
	} // doSetLayout()


	function clickSetLayout(event)
	{
			// Clear previous selection
		jQuery("#layout-choices img").removeClass("selected");
		var setLayoutDialog;

		setLayoutDialog = jQuery("#dialog-set-layout").dialog({
			height: 250,
			width: 300,
			modal: true,
			buttons: {
				Set: function() {
					var selected = jQuery("#layout-choices img.selected");
					if (selected.length) {
						doSetLayout(selected.data("index"));
					}
					setLayoutDialog.dialog("close");
				},
				Cancel: function() {
					setLayoutDialog.dialog("close");
				}
			},
			close: function() {
			}
		});

		event.preventDefault();
	} // clickSetLayout()


	function clickPerspectives(event)
	{
		event.preventDefault();
	} // clickPerspectives()


	function clickGoHome(event)
	{
		event.preventDefault();
	} // clickGoHome()


		// PURPOSE: Gather data about Filterable Attributes & Facet Browsers
	function prepFilterData()
	{
		prspdata.a.forEach(function(theAttribute) {
			switch (theAttribute.def.t) {
			case 'Vocabulary':
			case 'Text':
			case 'Number':
			case 'Dates':
				jQuery('#filter-list').append('<li data-id="'+theAttribute.id+'">'+theAttribute.def.l+'</li>');
				break;
			}
		});
	} // prepFilterData()

	function clickFilterToggle(event)
	{
		jQuery(this).parent().next().slideToggle(400);
		event.preventDefault();
	} // clickFilterToggle()

	function clickFilterDirty(event)
	{
		var head = jQuery(this).closest('.filter-instance');
		if (head) {
			var fID = head.data('id');
			var req = head.find('.req-att').is(':checked');
			if (fID && fID != '') {
				var fRec;
				fRec = filters.find(function(fr) { return fr.id == fID; });
				if (fRec == null)	{ alert('Bad Filter ID '+fID); return; }
				fRec.f.isReq(req);
			}
		}
	} // clickFilterDirty()

	function clickFilterDel(event)
	{
		var head = jQuery(this).closest('.filter-instance');
		var fID = head.data('id');
// console.log("Delete: "+fID);

		var fI, fRec;
		fI = filters.findIndex(function(fRec) { return fRec.id == fID; });
		if (fI == -1)	{ alert('Bad Filter ID '+fID); return; }

		filters.splice(fI, 1);
			// Deleted last filter in stack
		if (fI == filters.length) {
			var endStream;
				// No filters left, reset ViewFrame data source
			if (filters.length == 0)
				endStream = topStream;
			else
				endStream = filters[fi].out;
			view0.setStream(endStream);
			if (view1)
				view1.setStream(endStream);
			jQuery('#btn-recompute').addClass('highlight');
		} else {
				// Output must be recomputed from successor on
			filters[fi].f.isDirty(true);
		}

			// Remove this DOM element
		head.remove();
		event.preventDefault();
	} // clickFilterDel()


		// PURPOSE: Add a new filter to the stack
		// INPUT: 	fID = Attribute ID or index of Facet Browser
	function createFilter(fID)
	{
// console.log("Create Filter "+fID);
		var newID;
		do {
			newID = Math.floor((Math.random() * 1000) + 1);
			if (filters.findIndex(function(theF) { return theF.id == newID; }) != -1)
				newID = -1;
		} while (newID == -1);

		var newFilter;
		var theAtt = PDataHub.getAttID(fID);
		switch (theAtt.def.t) {
		case 'Vocabulary':
			newFilter = new PFilterVocab(newID, theAtt);
			break;
		case 'Text':
			newFilter = new PFilterText(newID, theAtt);
			break;
		case 'Number':
			newFilter = new PFilterNum(newID, theAtt);
			break;
		case 'Dates':
			newFilter = new PFilterDates(newID, theAtt);
			break;
		}

		var newFRec = { id: newID, f: newFilter, out: null };
		filters.push(newFRec);

			// Now create DOM structure and handle clicks
		var fh = _.template(jQuery('#txt-load-filter-head').html());
		jQuery('#filter-instances').append(fh({ newID: newID, title: newFilter.title() }));

		var head = jQuery('.filter-instance[data-id="'+newID+'"]');
		head.find('.btn-filter-toggle').button({
					text: false, icons: { primary: 'ui-icon-carat-2-n-s' }
				}).click(clickFilterToggle);
		head.find('.btn-filter-del').button({
					text: false, icons: { primary: 'ui-icon-trash' }
				}).click(clickFilterDel);
		head.find('.req-att').click(clickFilterDirty);

		jQuery('#btn-recompute').addClass('highlight');

			// Allow Filter to insert required HTML
		newFilter.setup();
	} // createFilter()


	function clickNewFilter(event)
	{
			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
		var newFilterDialog;

		newFilterDialog = jQuery("#dialog-new-filter").dialog({
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				Add: function() {
					var selected = jQuery("#filter-list li.selected");
					if (selected.length) {
						createFilter(selected.data("id"));
					}
						// Remove click handler
					newFilterDialog.dialog("close");
				},
				Cancel: function() {
						// Remove click handler
					newFilterDialog.dialog("close");
				}
			},
			close: function() {
			}
		});

		event.preventDefault();
	} // clickNewFilter()


	function clickToggleFilters(event)
	{
		jQuery('#filter-instances').slideToggle(400);
		event.preventDefault();
	} // clickToggleFilters()


		// IMMEDIATE EXECUTION
		//====================

	if (prspdata.e.g.l != '')
		jQuery('#title').append(prspdata.e.g.l);

		// Command Bar
	jQuery('#btn-recompute').button({icons: { primary: 'ui-icon-refresh' }, text: false })
			.click(clickRecompute);
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickSetLayout);
	jQuery('#btn-perspectives').button({icons: { primary: 'ui-icon-note' }, text: false })
			.click(clickPerspectives);
	jQuery('#btn-home').button({icons: { primary: 'ui-icon-home' }, text: false })
			.click(clickGoHome);


		// Handle selection of item on New Filter modal
	jQuery('#filter-list').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#filter-list li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Handle selection of item on Set Layout modal
	jQuery('#layout-choices').click(function(event) {
		if (event.target.nodeName == 'IMG') {
			jQuery("#layout-choices img").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Filter Control Bar
	jQuery('#btn-new-filter').button({icons: { primary: 'ui-icon-search' }, text: false })
			.click(clickNewFilter);
	jQuery('#btn-toggle-filters').button({icons: { primary: 'ui-icon-arrow-2-n-s' }, text: false })
			.click(clickToggleFilters);

		// Inspector Modal
	jQuery('#btn-inspect-left').button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false });
	jQuery('#btn-inspect-right').button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false });

	prepFilterData();

	state = PSTATE_REQ;

		// Intercept global state changes: data { pstate, component [0=global, 1=view1, 2=view2] }
	jQuery("body").on("prospect", function(event, data) {
		if (data.pstate = PSTATE_PROCESS) {
			state = PSTATE_PROCESS;
				// TO DO: Check views for ready state until they can render -- use timer
			doRecompute();
		}
	});

		// Initial primary visualization frame
	view0 = PViewFrame(0);
	view0.initDOM();

		// Init hub using config settings
	PDataHub.init();
});
