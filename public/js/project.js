function addData(content)
{
    var json = JSON.parse(content);
    alert("CALL: addData\n" + JSON.stringify(json[0]));
}