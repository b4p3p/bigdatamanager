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
    }

};