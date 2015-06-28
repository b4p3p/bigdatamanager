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

    addOptionValue : function( combo , value, isSpecial ) {
        var o = new Option(value, value);
        var jqo = $(o);
        jqo.html(value);
        combo.append(o);

        if (isSpecial) {
            var line = new Option();
            var jqline = $(line);
            jqline.attr("data-divider", true);
            jqo.attr("data-subtext", "No tag");
            combo.append(line);
        }
    },

    /**
     *
     * @param combo
     * @param group - {String}
     * @param options - {[String]}
     */
    addOptionGroup : function( combo , group, options ) {
        var group = $('<optgroup label="' + group + '"></optgroup>');
        for( var i = 0; i < options.length; i++)
        {
            group.append($('<option value="' + options[i].toLowerCase() + '" >' + options[i] + '</option>'))
        }
        combo.append(group);
    }
};