$( document ).ready(function() {
  /*global io*/
  var socket = io({transports: ['websocket']});
  // added {transports: ['websocket']} to work, idk why
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function(){
    var messageToSend = $('#m').val();
    //send message to server here?
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
  $('#clean-chat').click(() => {
    $('ul').empty();
  });
  
  socket.on('user', function(data){
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name;
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>'+ message +'<\/b>'));
  });
  
  socket.on('chat message', (data) => {
    if (data.message !== "") {
      $('#messages').append($('<li>').html('<b>'+ data.name +'</b>: ' + data.message));
      $("#messages").animate({scrollTop: $('#messages li:last').offset().top + 2000});
      if ($("#messages li").length > 30) { // here i need to count the li elements INSIDE the #messages id
        $('#messages li').first().remove();
      } 
    }
  });
});
