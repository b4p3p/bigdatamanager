"use strict";

var DomUtil = {

    replaceItSelf: function($el)
    {
        $el.replaceWith( $el = $el.clone( true ) );
    },

    clearSelectpicker: function($el)
    {
        $el.empty();
        $el.selectpicker('refresh');
    },

    clearMultiselect: function($el){

        $el.empty();
        $el.multiselect('refresh');

    },

    addOptionValue : function( combo , option, subtext ) {

        var $o = $('<option value="' + option.toLowerCase() + '" >' + option + '</option>')
        if (subtext) {
            $o.attr("data-subtext", subtext);
        }
        combo.append($o);
    },

    /**
     *
     * @param combo
     * @param title - {String}
     * @param options - {[String]}
     * @param subtext - {[String]}
     */
    addOptionGroup : function( combo , title, options, subtext ) {

        var $group = $('<optgroup label="' + title + '"></optgroup>');

        for( var i = 0; i < options.length; i++)
        {
            var $o = $('<option value="' + options[i].toLowerCase() + '" >' + options[i] + '</option>');
            if(subtext)
                $o.attr("data-subtext", subtext[i]);

            $group.append($o);
        }

        combo.append($group);
    },

    getSelectedCombo: function( $combo )
    {
        var tags = [];
        var options = $combo.find(":selected");

        for ( var i = 0; i < options.length; i++)
            tags.push ( options[i].text );

        return tags;
    },

    selectAll: function( $combo )
    {
        var options = $combo.find('option');

        for (var i = 0; i < options.length; i++)
            $(options[i]).prop('selected', true);
    },

    getParent: function( $combo, option )
    {
        return $combo.find('option[label="'+option+'"]').closest("optgroup").attr('label');
    },

    deselectAll: function( $combo )
    {
        var options = $combo.find('option');

        for (var i = 0; i < options.length; i++)
            $(options[i]).prop('selected', false);
    },

    getIntervalFromRangeSlider: function( $slider )
    {
        return $slider.dateRangeSlider("values");
    }

};

var ObjConditions = function($cmbNations, $cmbRegions, $cmbTags, $sliderTimer) {

    this.$cmbNations = $cmbNations;
    this.$cmbRegions = $cmbRegions;
    this.$cmbTags = $cmbTags;
    this.$sliderTimer = $sliderTimer;
    this.queryString = "";
    this.value = {};

    this.create = function()
    {
        var arrayQueryString = [];
        var regions = DomUtil.getSelectedCombo(this.$cmbNations);
        var nations = DomUtil.getSelectedCombo(this.$cmbNations);
        var tags = DomUtil.getSelectedCombo(this.$cmbTags);
        var interval = DomUtil.getIntervalFromRangeSlider(this.$sliderTimer);

        if(nations.length > 0)
            arrayQueryString.push("nations=" + nations.join(","));

        if(tags.length > 0)
            arrayQueryString.push("tags=" + tags.join(","));

        arrayQueryString.push("start=" + interval.min.yyyymmdd());
        arrayQueryString.push("end=" + interval.max.yyyymmdd());

        if( arrayQueryString != [] )
            this.queryString = "?" + arrayQueryString.join("&");

        this.value = {
            queryString : this.queryString,
            conditions: {
                nations : nations,
                tags: tags,
                regions: regions,
                interval: {
                    min: interval.min ,
                    max: interval.max
                }
            }
        };

    };

    this.create();

    this.getQueryString = function()
    {
        return this.value.queryString;
    };

    this.getConditions = function()
    {
        return this.value.conditions;
    };

    this.containRegion = function(region)
    {
        return this.value.conditions.regions.indexOf(region) != -1;
    };

    this.containNation = function(nation)
    {
        return this.value.conditions.nations.indexOf(nation) != -1;
    };

};