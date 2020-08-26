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
    $('#messages').empty();
  });

  //i receiving the data of an array and put it in the ul of #users
  socket.on('users', data => {
    var colors = ['#7FFF00', '#385898'];
    //console.log(data.connectedUsers);
    $('#users').empty();
    data.users.map(user => {
      var color = user.provider == "github" ? colors[0] : colors[1];
      if (data.connectedUsers.indexOf(user.name) !== -1) {
        return $('#users').append($('<li>').html('<b>' + user.name + '<\/b>: ' + '<b style="color: green;">connected<\/b> ' + 
        '<b style="color: ' + color + ';">' + user.provider + '<\/b>'));
      }else {
        return $('#users').append($('<li>').html('<b>' + user.name + '<\/b>: ' + '<b style="color: red;">disconnected<\/b>'));
      }
    });
  });
  
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
