@extends('layouts.app')

@section('content')
    <!-- Basic Data Tables -->
    <!--===================================================-->
    <div class="panel">
        <div class="panel-heading bord-btm clearfix pad-all h-100">
            <h3 class="panel-title pull-left pad-no">{{ translate('Affiliate Users')}}</h3>
        </div>
        <div class="panel-body">
            <table class="table table-striped res-table mar-no" cellspacing="0" width="100%">
                <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Name')}}</th>
                    <th>{{ translate('Phone')}}</th>
                    <th>{{ translate('Email Address')}}</th>
                    <th>{{ translate('Verification Info')}}</th>
                    <th>{{ translate('Approval')}}</th>
                    <th>{{  translate('Due Amount') }}</th>
                    <th width="10%">{{ translate('Options')}}</th>
                </tr>
                </thead>
                <tbody>
                @foreach($affiliate_users as $key => $affiliate_user)
                    @if($affiliate_user->user != null)
                        <tr>
                            <td>{{ ($key+1) + ($affiliate_users->currentPage() - 1)*$affiliate_users->perPage() }}</td>
                            <td>{{$affiliate_user->user->name}}</td>
                            <td>{{$affiliate_user->user->phone}}</td>
                            <td>{{$affiliate_user->user->email}}</td>
                            <td>
                                @if ($affiliate_user->informations != null)
                                    <a href="{{ route('affiliate_users.show_verification_request', $affiliate_user->id) }}">
                                        <div class="label label-table label-info">
                                            {{ translate('Show')}}
                                        </div>
                                    </a>
                                @endif
                            </td>
                            <td>
                                <label class="switch">
                                    <input onchange="update_approved(this)" value="{{ $affiliate_user->id }}" type="checkbox" <?php if($affiliate_user->status == 1) echo "checked";?> >
                                    <span class="slider round"></span>
                                </label>
                            </td>
                            <td>
                                @if ($affiliate_user->balance >= 0)
                                    {{ single_price($affiliate_user->balance) }}
                                @endif
                            </td>
                            <td>
                                <div class="btn-group dropdown">
                                    <button class="btn btn-primary dropdown-toggle dropdown-toggle-icon" data-toggle="dropdown" type="button">
                                        {{ translate('Actions')}} <i class="dropdown-caret"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-right">
                                        <li><a onclick="show_payment_modal('{{$affiliate_user->id}}');">{{ translate('Pay Now')}}</a></li>
                                        <li><a href="{{route('affiliate_user.payment_history', encrypt($affiliate_user->id))}}">{{ translate('Payment History')}}</a></li>
                                        {{-- <li><a onclick="confirm_modal('{{route('sellers.destroy', $affiliate_user->id)}}');">{{ translate('Delete')}}</a></li> --}}
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    @endif
                @endforeach
                </tbody>
            </table>
            <div class="clearfix">
                <div class="pull-right">
                    {{ $affiliate_users->appends(request()->input())->links() }}
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="payment_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content" id="modal-content">

            </div>
        </div>
    </div>

    <div class="modal fade" id="profile_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content" id="modal-content">

            </div>
        </div>
    </div>


@endsection

@section('script')
    <script type="text/javascript">
        function show_payment_modal(id){
            $.post('{{ route('affiliate_user.payment_modal') }}',{_token:'{{ @csrf_token() }}', id:id}, function(data){
                $('#payment_modal #modal-content').html(data);
                $('#payment_modal').modal('show', {backdrop: 'static'});
                $('.demo-select2-placeholder').select2();
            });
        }

        function update_approved(el){
            if(el.checked){
                var status = 1;
            }
            else{
                var status = 0;
            }
            $.post('{{ route('affiliate_user.approved') }}', {_token:'{{ csrf_token() }}', id:el.value, status:status}, function(data){
                if(data == 1){
                    showAlert('success', 'Approved sellers updated successfully');
                }
                else{
                    showAlert('danger', 'Something went wrong');
                }
            });
        }

        // function sort_sellers(el){
        //     $('#sort_sellers').submit();
        // }
    </script>
@endsection
