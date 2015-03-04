/**
 * @jsx React.DOM
 */
var ExampleApplication = React.createClass({
  render: function() {
    var user = "demmer ©";
    return <p>©{user}</p>;
  }
});

var start = new Date().getTime();

setInterval(function() {
  React.renderComponent(
    <ExampleApplication elapsed={new Date().getTime() - start} />,
    document.getElementById('container')
  );
}, 50);
