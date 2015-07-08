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
        if(!$combo) return tags;
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
        if(!$slider) return {};
        return $slider.dateRangeSlider("values");
    }

};

var ObjConditions = function($cmbNations, $cmbRegions, $cmbTags, $sliderTimer, $cmbUsers) {

    this.$cmbNations = $cmbNations;
    this.$cmbRegions = $cmbRegions;
    this.$cmbTags = $cmbTags;
    this.$sliderTimer = $sliderTimer;
    this.$cmbUsers = $cmbUsers;
    this.queryString = "";
    this.value = {};

    this.create = function()
    {
        var arrayQueryString = [];
        var regions = DomUtil.getSelectedCombo(this.$cmbRegions);
        var nations = DomUtil.getSelectedCombo(this.$cmbNations);
        var tags = DomUtil.getSelectedCombo(this.$cmbTags);
        var users = DomUtil.getSelectedCombo(this.$cmbUsers);
        var interval = DomUtil.getIntervalFromRangeSlider(this.$sliderTimer);

        if(nations.length > 0)
            arrayQueryString.push("nations=" + nations.join(","));

        if(regions.length > 0)
            arrayQueryString.push("regions=" + regions.join(","));

        if(tags.length > 0)
            arrayQueryString.push("tags=" + tags.join(","));

        if(users.length > 0)
            arrayQueryString.push("users=" + users.join(","));

        if(this.$sliderTimer)
        {
            arrayQueryString.push("start=" + interval.min.yyyymmdd());
            arrayQueryString.push("end=" + interval.max.yyyymmdd());
            interval = {
                min: interval.min,
                max: interval.max
            };
        }

        if( arrayQueryString != [] )
            this.queryString = "?" + arrayQueryString.join("&");

        this.value = {
            queryString : this.queryString,
            conditions: {
                nations : nations,
                regions: regions,
                tags: tags,
                interval: interval,
                users: users
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
        return  this.value.conditions.regions.length == 0 ||
                this.value.conditions.regions.indexOf(region) != -1;
    };

    this.containUser = function(user)
    {
        return  this.value.conditions.users.length == 0 ||
            this.value.conditions.users.indexOf(user) != -1;
    };

    this.containNation = function(nation)
    {
        return  this.value.conditions.nations.length == 0 ||
                this.value.conditions.nations.indexOf(nation) != -1;
    };

    this.containTag = function(tag)
    {
        return  this.value.conditions.tags.length == 0 ||
                this.value.conditions.tags.indexOf(tag) != -1;
    };

    this.isInRange = function(date)
    {
        var d = new Date(date);
        return  d >= this.value.conditions.interval.min &&
                d <= this.value.conditions.interval.max
    };



};