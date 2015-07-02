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

    addOptionValue : function( combo , value, subtext ) {

        var o = new Option(value, value);
        var $o = $(o);

        $o.html(value);

        if (subtext) {
            $o.attr("data-subtext", subtext);
        }

        combo.append(o);
    },

    /**
     *
     * @param combo
     * @param group - {String}
     * @param options - {[String]}
     * @param subtext - {[String]}
     */
    addOptionGroup : function( combo , group, options, subtext ) {
        var group = $('<optgroup label="' + group + '"></optgroup>');
        for( var i = 0; i < options.length; i++)
        {
            group.append( $('<option value="' + options[i].toLowerCase() + '" >' + options[i] + '</option>'))
        }
        combo.append(group);
    },

    getSelectedCombo: function( $combo )
    {
        var tags = [];
        var options = $combo.find(":selected");

        for ( var i = 0; i < options.length; i++)
            tags.push ( options[i].text );

        return tags;
    },

    selectAll: function( $combo ) {
        var options = $combo.find('option');

        for (var i = 0; i < options.length; i++)
            $(options[i]).prop('selected', true);
    },

    getParent: function( $combo, option ) {
        return $combo.find('option[label="'+option+'"]').closest("optgroup").attr('label');
    }

};