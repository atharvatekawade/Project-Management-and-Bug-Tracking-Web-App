import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import $ from 'jquery';

const right=require('./right.png');
const left=require('./left.png');


export default class Notification extends Component{
    constructor(props){
        super(props);
        this.state={
            projects:0,
            bugs:0,
            new:0,
            msg:0,
            payments:0,
            isOpen:false
        }
        this.toggle = this.toggle.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.power=this.power.bind(this);
    }

    componentDidMount(){
        this.setState({isOpen:false});
    }

    toggle(){
        this.setState({isOpen:!this.state.isOpen})
    }

    open(){
        $(document).ready(function() {
            $("#menu").css("width", 175);
            $("#move").css("marginLeft", 175);
            $("#inside").attr("src",left);
            
            
        });
        this.setState({isOpen:!this.state.isOpen}) 

    }

    close(){        
        $(document).ready(function() { 
            $("#menu").css("width", 0);
            $("#content").css("marginLeft", 0); 
            $("#move").css("marginLeft",0); 
            $("#inside").attr("src",right);
            
        });
        this.setState({isOpen:!this.state.isOpen})
    }

    power(){
        if(!this.state.isOpen){
            this.open();
        }
        else{
            this.close();
        }

    }

    render(){
        return(
            
                <div id='content' style={{marginTop:"30%"}}>
                    <span id='move' className='dot' onClick={this.power}><img className="fa fa-arrow-right dot" aria-hidden="true" id='inside' src={right} /></span>
                    <div id='menu' className='na' style={{"backgroundColor":'rgba(30,30,30,0.8)',position:"absolute",top:"0px",color:'rgba(240,240,245,0.8)',height:"150px"}}>
                            <div>
                                <span style={{display:"inline",fontSize:"18px"}} className='ml-2'>1.</span>
                                <a href='/notifications/urgent' className="ml-2" style={{display:"inline",color:'rgba(240,240,245,0.8)'}}>Urgent</a>
                                <hr />
                            </div>
                            <div>
                                <span style={{display:"inline",fontSize:"18px"}} className='ml-2'>2.</span>
                                <a href='/notifications/new' className="ml-2" style={{display:"inline",color:'rgba(240,240,245,0.8)'}}>New</a>
                            </div>

                    </div>
                </div>        

        )
    }
}