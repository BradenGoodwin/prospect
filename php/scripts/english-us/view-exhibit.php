<div id="command-bar">
	<span id="title"></span>
	&nbsp; &nbsp;<button id="btn-about">About Prospect</button>
	<button id="btn-hs-bars">Show/Hide Filters</button>
	<button id="btn-set-layout">Show/Hide View 2</button>
	<button id="btn-show-prspctv">Show Perspective</button>
	<button id="btn-save-prspctv">Save Perspective</button>
	<button id="btn-annote">Show/Hide Annotation</button>
	&nbsp; <span id="pstate" class="attn">Initializing</span>
	<span class="home"><span id="home-title"></span> <button id="btn-home">Home</button></span>
</div>

<div id="annote" style="display:none;">
</div>

<div id="filter-frame">
	<div id="filter-control-bar">
		Filters
		<button id="btn-new-filter">New Filter</button>
		<button id="btn-toggle-filters" disabled="disabled">Show/Hide Filters</button>
		<button id="btn-f-state" disabled="disabled">No Filters</button>
	</div>
	<div id="filter-instances">
	</div>
</div>

<div id="viz-frame">
</div>

	<!-- Insertion points to ensure proper stacking of multiple dialogs -->
<div id="dialog-1">
</div>

<div id="dialog-2">
</div>

<!-- DYNAMIC JQUERYUI CONTENT -->
<div style="display:none">
	<div id="dialog-hilite-0" title="Highlight On View 1">
		<div class="filter-instance" data-id="0">
			Attribute which provides condition: <span class="filter-id">(None selected)</span>
			<div id="hilite-0" class="filter-body">
			</div>
		</div>
	</div>

	<div id="dialog-hilite-1" title="Highlight On View 2">
		<div class="filter-instance" data-id="1">
			Attribute which provides condition: <span class="filter-id">(None selected)</span>
			<div id="hilite-1" class="filter-body">
			</div>
		</div>
	</div>

	<div id="dialog-choose-att" title="Choose Attribute">
		<div class="scroll-container">
			<ul id="filter-list">
			</ul>
		</div>
	</div>

	<div id="dialog-sortby" title="Sort By">
	</div>

	<div id="dialog-inspector" title="Record Inspector">
		<div class="inspector-header">
			<button id="btn-inspect-left">Previous</button>
			<span id="inspect-name"></span>
			<button id="btn-inspect-right">Next</button>
		</div>
		<div id="inspect-content" class="scroll-container">
		</div>
	</div>

	<div id="dialog-opacities" title="Layer Opacities">
		<div class="layer-list">
		</div>
	</div>

	<div id="dialog-about" title="About Prospect&#8482;">
		<div class="scroll-container">
			<p>Prospect&#8482; 0.9.19</p>
			<img class="logo"/>
			<p>From the <a href="http://digitalinnovation.unc.edu" target="_blank">Digital Innovation Lab</a> of the <a href="http://www.unc.edu" target="_blank">University of North Carolina, Chapel Hill</a>.</p>
			<p style="margin:6px"><b>Credits:</b><br/>
			Michael Newton: Software architect and developer.<br/>
			Breon Williams: CSS contributions.</p>
			<p><a href="http://prospect.web.unc.edu" target="_blank">See more about Prospect</a>.</p>
		</div>
	</div>

	<div id="dialog-vnotes" title="Notes on Visualization">
		<div id="vnotes-txt" class="scroll-container">
		</div>
	</div>

	<div id="dialog-save-prsrctv" title="Save Perspective">
		<fieldset class="radiogroup">
			<legend>Where to save</legend>
			<ul class="radio">
				<li><input type="radio" name="save-prspctv-dest" id="save-prspctv-d-1" value="local" checked/><label for="save-prspctv-d-1">Private (Your Browser)</label></li>
				<li><input type="radio" name="save-prspctv-dest" id="save-prspctv-d-2" value="server"/><label for="save-prspctv-d-2">Public (Web Server: Account required)</label></li>
			</ul>
		</fieldset>
		Unique ID:<br/>
		<input id="save-prspctv-id" type="text" size="20" placeholder="Unique ID"/><br/>
		Label:<br/>
		<input id="save-prspctv-lbl" type="text" size="42" placeholder="Label"/><br/>
		<input type="checkbox" name="save-prspctv-h0" id="save-prspctv-h0"/> <label for="save-prspctv-h0">Save Highlight Filter 1</label> <input type="checkbox" name="save-prspctv-h1" id="save-prspctv-h1" disabled="disabled"/> <label for="save-prspctv-h1">Save Highlight Filter 2</label><br/>
		<textarea id="save-prspctv-note" rows="4" cols="50" placeholder="Add an annotation (cannot use double quotes)" style="margin-top: 4px"></textarea>
	</div>

	<div id="dialog-edit-prsrctv" title="Edit Perspective">
		Label:<br/>
		<input id="edit-prspctv-lbl" type="text" size="42" placeholder="Label"/><br/>
		<textarea id="edit-prspctv-note" rows="5" cols="48" placeholder="Annotation (cannot use double quotes)" style="margin-top: 4px"></textarea>
	</div>

	<div id="dialog-show-prsrctv" title="Show Perspective">
		Perspectives:<br/>
		<div class="scroll-container">
			<ul id="prspctv-slist">
			</ul>
		</div>
	</div>

	<div id="dialog-manage-prsrctv" title="Manage Perspectives">
		<div class="scroll-container">
			<ul id="prspctv-mlist">
			</ul>
		</div>
	</div>

	<div id="dialog-prspctv-id-used" title="Perspective ID Error">
		<p>That Perspective ID has already been used. Please create another (alphabetic characters, numbers, hyphens and underscores only), or click the 'Cancel' button.</p>
	</div>

	<div id="dialog-prspctv-id-badchars" title="Perspective ID Error">
		<p>That Perspective ID has illegal characters or is too long. Please create another ID of no more than 20 characters (alphabetic characters, numbers, hyphens and underscores only, no spaces), or click the 'Cancel' button.</p>
	</div>

	<div id="dialog-prspctv-label-bad" title="Perspective ID Error">
		<p>You must enter a label for the Perspective between 1 and 32 characters in length.</p>
	</div>

	<div id="dialog-prspctv-url" title="Perspective URL">
		<p>To show this Perspective after it has been Published on the server, use the following URL:</p>
		<textarea id="save-prspctv-embed" cols="60" rows="3" readonly="readonly"></textarea>
	</div>
</div> <!-- Hidden content ->

<!-- DYNAMICALLY LOADED TEXT -->
<script id="dltext-view-controls" type='text'>
	<div class="view-controls">
		<select class="view-viz-select" title="Select a visualization from this list">
		</select>
		<button class="hslgnd">Show/Hide Legend</button>
		<button class="vopts">View Options</button>
		<button class="vnote">Visualization Notes</button>
		<button class="hilite">Highlight</button>
		<button class="xsel">Clear Highlighted</button>
		<button class="osel">Show Highlighted</button>
	</div>
	<div class="lgnd-container">
		<div class="lgnd-handle">
			<button class="lgnd-update">Update</button>
		</div>
		<div class="lgnd-scroll">
		</div>
	</div>
	<div class="viz-content">
		<div class="viz-result">
		</div>
	</div>
</script>

<script id="dltext-v-map" type='text'>
	<div class="ui-widget-header ui-corner-all iconbar">
		<button id="map-zoom-<%= vi %>">Zoom</button>
		<button id="map-unzoom-<%= vi %>">Unzoom</button>
		<button id="map-reset-<%= vi %>">Reset</button>
		<button id="map-cloc-<%= vi %>">Current Location</button>
	</div>
</script>

<script id="dltext-v-nwheel" type='text'>
	<div class="ui-widget-header ui-corner-all iconbar">
		<button id="nw-prev-<%= vi %>">Reverse</button> <button id="nw-for-<%= vi %>">Forward</button>&nbsp;
		<span id="nw-size-<%= vi %>">
			<input type="radio" id="nw-size-1-<%= vi %>" name="nw-size-<%= vi %>" checked="checked"><label for="nw-size-1-<%= vi %>">Single</label>
			<input type="radio" id="nw-size-90-<%= vi %>" name="nw-size-<%= vi %>"><label for="nw-size-90-<%= vi %>">90&deg;</label>
		</span>
	</div>
</script>

<script id="dltext-filter-head" type='text'>
<div class="filter-instance" data-id="<%= newID %>">
	<div class="filter-head">
		<%= title %> &nbsp; <%= apply %></span>
		<button class="btn-filter-toggle">Toggle</button>
		<button class="btn-filter-del">Delete Filter</button>
	</div>
	<div class="filter-body">
	</div>
</div>
</script>

<script id="dltext-filter-template" type='text'>
	<input type="checkbox" class="apply-tmplt-<%= ti %>"> Apply to <%= tl %>
</script>

<script id="dltext-filter-remove" type='text'>
All Records from selected Templates will be removed/hidden.
</script>

<script id="dltext-filter-text" type='text'>
	<input type="checkbox" class="filter-text-cs" checked="checked">Case sensitive&nbsp;&nbsp;
	Text must include <input class="filter-text" type="text" size="20"/>
</script>

<script id="dltext-filter-tags" type='text'>
	<input type="checkbox" class="filter-text-cs" checked="checked">Case sensitive&nbsp;&nbsp;
	<input type="checkbox" class="filter-text-p">Part of tag&nbsp;&nbsp;
	Tags must include <input class="filter-text" type="text" size="20"/>
</script>

<script id="dltext-filter-nums" type='text'>
	<div class="cntrl-blck">
		<input type="checkbox" class="allow-undef"> Allow indefinite<br/>
		Min <input type="text" class="from" size="5"><br/>
		Max <input type="text" class="to" size="5"><br/>
		<button class="filter-update" disabled="disabled">Use Numbers</button>
	</div>
</script>

<script id="dltext-filter-dates" type='text'>
	<div class="cntrl-blck">
		<input type="radio" name="dctrl-<%= id %>" value="o" checked> Overlap<br>
		<input type="radio" name="dctrl-<%= id %>" value="c"> Contain<br>
		<input type="checkbox" class="allow-undef"> Allow indefinite
	</div>
	<div class="cntrl-blck">
		Date Format: YYYY &nbsp; MM &nbsp; DD<br/>
		From <input type="text" class="from-y" size="5" placeholder="YYYY"/> <input type="text" class="from-m" size="2" placeholder="MM"/> <input type="text" class="from-d" size="2" placeholder="DD"/>
		<br/>
		To <input type="text" class="to-y" size="5" placeholder="YYYY"/> <input type="text" class="to-m" size="2" placeholder="MM"/> <input type="text" class="to-d" size="2" placeholder="DD"/>
		<br/>
		<button class="filter-update" disabled="disabled">Use Dates</button>
	</div>
</script>

<script id="dltext-removehideall" type="text">
Remove/Hide All
</script>

<script id="dltext-showhideall" type="text">
Show/Hide All
</script>

<script id="dltext-ok" type="text">
OK
</script>

<script id="dltext-cancel" type="text">
Cancel
</script>

<script id="dltext-seerec" type="text">
See Record
</script>

<script id="dltext-close" type="text">
Close
</script>

<script id="dltext-add" type="text">
Add
</script>

<script id="dltext-choose-att" type="text">
Choose Attribute
</script>

<script id="dltext-to" type="text">
to
</script>

<script id="dltext-approximately" type="text">
about
</script>

<script id="dltext-now" type="text">
now
</script>

<script id="dltext-undefined" type="text">
Indefinite
</script>

<script id="dltext-delete" type="text">
Delete
</script>

<script id="dltext-manage" type="text">
Manage
</script>

<script id="dltext-edit" type="text">
Edit
</script>

<script id="dltext-markers" type="text">
Markers
</script>

<script id="dltext-hint-marker" type="text">
Marker size corresponds to
</script>

<script id="dltext-hint-text" type="text">
Text size corresponds to
</script>

<script id="dltext-xaxis" type="text">
X-Axis
</script>

<script id="dltext-yaxis" type="text">
Y-Axis
</script>

<script id="dltext-orderedby" type="text">
records ordered by
</script>

<script id="dltext-grpblks" type="text">
Records grouped in blocks by
</script>

<script id="dltext-reset" type="text">
RESET
</script>

<script id="dltext-nofilter" type="text">
No Filters
</script>

<script id="dltext-dofilters" type="text">
Run Filters
</script>

<script id="dltext-filtered" type="text">
Filtered
</script>

<script id="dltext-sync-xscript" type="text">
<input type="checkbox" id="sync-xscript" name="sync-xscript" checked> Scroll transcript to follow playback
</script>

<script id="dltext-month-names" type="text">
Jan|Feb|Mar|Apr|May|June|July|Aug|Sep|Oct|Nov|Dec
</script>

<!-- Localization data for D3JS: see https://github.com/mbostock/d3/wiki/Localization -->
<!-- Leave empty if no localization needed (English default) -->
<script id="dltext-d3-local" type="text">
</script>

<script id="dltext-pstates" type="text">
Loading|Processing|Building|Updating|Ready
</script>