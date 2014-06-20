
/*
 * Variables which implement two libraries required for this code. LeapJS (Leap Motion) and Johnny-Five (Arduino - UNO)
 */
var Leap = require('leapjs');
var jFive = require('johnny-five');
var arduino = require('events').EventEmitter;

/*
 * Initialize variables for Servo Motors and Board
 */
 var baseServo, clawServo, elbowServo, shoulderServo, base;
 var bothAngles, shoulderAngle, clawAngle, elbowAngle, baseAngle; 
 var frames = []; 

var controller = new Leap.Controller();
controller.on('frame', function(frame){
	if(frame.hands.length > 0){
		var position = frame.hands[0].palmPosition;
		if(position[1] < 100){
			position[1] = 100;
		}
		if(position[1] > 415){
			position[1] = 415;
		}
		if(position[2] < 110){
			position[2] = 110;
		}

		bothAngles = inversekinematics(0, position[1], position[2]);
		//shoulderAngle = 180-radianToDegree(bothAngles.theta1);
		elbowAngle =  45+radianToDegree(bothAngles.theta2);
		base = Math.atan(position[1]/position[0]);
		baseAngle = radianToDegree(base);
		//baseAngle = 180 - (calcBaseAngle(position[0]));
		console.log(baseAngle);	
	}
	if(frame.pointables.length > 0){
		
		var finger1 = frame.pointables[0].tipPosition[0];
		var finger2 = frame.pointables[1].tipPosition[0];
		if(finger1 > finger2){
			var difference = finger1 - finger2; 
			//console.log("This is the differece: "+difference);
		}else{
			var difference = finger2 - finger1; 
			//console.log("This is the difference: "+difference);
		}
		var claw = Math.cos(difference);
		clawAngle = 180-(difference*2);
		console.log("This is the claw angle: " + difference);
		//clawAngle = miliToDegree(difference)*30;
	}
	frames.push(frame);

});

/*
 * Connect the Leap Controller
 */
controller.on('connect', function(frame) {
  console.log("Leap Connected.");
  setTimeout(function() { 
    var time = frames.length/2;
  }, 200);
});

// Leap controller connected. 
controller.connect();


/*
 * Connect the arduino and leap motion using the Johnny Five library. 
 * Initialize the Arduino Board with default initial positions of all four servo motors which represent: Elbow, Shoulder, Base, and Claw.
 */
arduino = new jFive.Board();
arduino.on('ready', initialize);


function initialize(){
	console.log("Connected");
		// //Initialize the servo 
	baseServo = new jFive.Servo(8);
	clawServo = new jFive.Servo (6);
	elbowServo = new jFive.Servo(12);
	shoulderServo = new jFive.Servo(3);

	//Default position of the arm in terms of degrees 
	baseServo.to(70);	
	shoulderServo.to(60);
	elbowServo.to(130);
	clawServo.to(20);

	this.loop(40, Loop); 
}

function Loop(){
	if( !isNaN(elbowAngle)) { //!isNaN(shoulderAngle) &&
      //shoulderServo.to(shoulderAngle);
      elbowServo.to(elbowAngle);
      //arduino.removeAllListeners('exit');
      console.log("This is the elbow angle: "+ elbowAngle);
    } else {
 	  //arduino.removeAllListeners('exit');
      console.log("Shoulder/Elbow NaN value detected.");
    }
    if( baseAngle <= 180) {
      baseServo.to(baseAngle);
      //arduino.removeAllListeners('exit');
      console.log("Base angle moved to " + baseAngle);
    }
    if(clawAngle >= 0 && clawAngle <= 120) {
      //clawAngle = -clawAngle;

      console.log("This is the claw angle: " + clawAngle);
      clawServo.to(clawAngle);
      arduino.removeAllListeners('exit');
      //console.log("This is the claw angle: "+ clawAngle );
    }

    arduino.removeAllListeners('exit');
}

/*
 * Length of the shoulder  = 19 cm or 190 mm 
 * Length of the elbow  = 15 cm or 150 mm 
 */
 var sL = 190; // mm  
 var eL = 150;  // mm 

/*
 * I have used Inverse Kinematics to find two angles: Shoulder Angle and the Elbow Angle
 * Source of the formula: http://
 * @param: x = x-axis of the leap motion; y = y-axis of the leap motion; z = z-axis of the leap motion. 
 * @return: returns two angles, theta1 = elbow angle and theta2 = elbow angle. 
 */
function inversekinematics(x,y,z){
	// x is the x-axis of the leap motion, y is the y-axis of the leap motion and z is the z-axis of the leap motion
	
	z = -z ; 
	y = y*1.5;
	var angle1 = Math.acos((squareOF(y)+squareOF(z)-squareOF(sL)-squareOF(eL))/(2*sL*eL));
	var angle2 = Math.asin(((eL+sL*Math.cos(angle1))*y-sL*Math.sin(angle1)*z)/(squareOF(eL)+squareOF(sL)+2*eL*sL*Math.cos(angle1))); 
	console.log("The elbow angle is : " + radianToDegree(angle1));
	return {
		theta1: angle1,
		theta2: angle2
	}
}


/*
 * Important formulas. 
 */


function squareOF(x){
	return x*x; 
}

function radianToDegree(x){
	return x*57.2957795131; // www.convertunits.com/from/mil/to/degree
}

function miliToDegree(x){
	return x * 0.05625; 
}




