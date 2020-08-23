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

  $('#num-users').hover(
    function() {
      $(this).append($('<span>Over!</span>'));
    }, function() {
      $(this).find("span").last().remove();
    }
  );
  
  socket.on('user', function(data){
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name;

    if(data.connected) {
      message += ' se ha conectado al xhatting!.';
    } else {
      message += ' ha dejado el xhatting.';
    }
    $('#messages').append($('<li>').html('<b style="color:'+ data.color + ';">'+ message +'<\/b>'));
  });
  
  socket.on('chat message', (data) => {
    
    if (data.message !== "") {
      $('#messages').append($('<li>').html('<b  style="color:' + data.color + ';">'+ data.name +':</b> ' + data.message));
      $("#messages").animate({scrollTop: $('#messages li:last').offset().top + 2000});
      if ($("#messages li").length > 40) { // here i need to count the li elements INSIDE the #messages id
        $('#messages li').first().remove();
      } 
    }
  });
});
