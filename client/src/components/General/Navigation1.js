import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  Container,
  NavLink
} from 'reactstrap';
import axios from 'axios';


const logo = require('./insect_1.png');

export default class Navigation1 extends Component{
    constructor(props){
        super(props);
        this.state={
            isOpen:false
        }
        this.toggle=this.toggle.bind(this);
        this.logout=this.logout.bind(this);
    }

    toggle(){
        this.setState({isOpen:!this.state.isOpen})
    }


    logout(){
        axios.delete('/logout')
            .then(res => window.location="/");
    }

    render(){
        return(
            <div>
                <Navbar dark expand='sm' className='mb-1 nav'>
                    <Container>
                        <NavbarBrand href='/' style={{color:"rgba(10,10,10,0.7)"}}><b className='mr-2'>Home</b></NavbarBrand>
                        <NavbarToggler onClick={this.toggle} />
                        <Collapse isOpen={this.state.isOpen} navbar>
                            <Nav className='ml-auto' navbar>
                                <NavItem>
                                    <NavLink href='/login' style={{color:"rgba(30,30,30,0.65)"}} className='mr-4'>Login</NavLink>
                                </NavItem>
                            </Nav>
                        </Collapse>
                    </Container>
                </Navbar>
            </div>
        )
    }
}