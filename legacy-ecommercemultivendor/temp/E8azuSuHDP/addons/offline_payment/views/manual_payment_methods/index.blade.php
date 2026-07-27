@extends('layouts.app')

@section('content')

<div class="row">
    <div class="col-sm-12">
        <a href="{{ route('manual_payment_methods.create')}}" class="btn btn-rounded btn-info pull-right">{{translate('Add New Method')}}</a>
    </div>
</div>

<br>

<div class="panel">
    <div class="panel-heading bord-btm clearfix pad-all h-100">
        <h3 class="panel-title pull-left pad-no">{{translate('Manual Payment Method')}}</h3>
    </div>
    <div class="panel-body">
        <table class="table table-striped res-table mar-no" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{translate('Heading')}}</th>
                    <th>{{translate('Logo')}}</th>
                    <th width="10%">{{translate('Options')}}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($manual_payment_methods as $key => $manual_payment_method)
                    <tr>
                        <td>{{ ($key+1) }}</td>
                        <td>{{ $manual_payment_method->heading }}</td>
                        <td><img loading="lazy"  class="img-md" src="{{ my_asset($manual_payment_method->photo) }}" alt="Logo"></td>
                        <td>
                            <div class="btn-group dropdown">
                                <button class="btn btn-primary dropdown-toggle dropdown-toggle-icon" data-toggle="dropdown" type="button">
                                    {{translate('Actions')}} <i class="dropdown-caret"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-right">
                                    <li><a href="{{route('manual_payment_methods.edit', encrypt($manual_payment_method->id))}}">{{translate('Edit')}}</a></li>
                                    <li><a onclick="confirm_modal('{{route('manual_payment_methods.destroy', $manual_payment_method->id)}}');">{{translate('Delete')}}</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

@endsection
